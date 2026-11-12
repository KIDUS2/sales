package com.shop.sales.service;

import static com.shop.sales.util.Money.round;
import com.shop.sales.dto.*;
import com.shop.sales.enumuration.Role;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.*;
import com.shop.sales.security.AuthUser;
import com.shop.sales.security.CurrentUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stock given to a salesperson. Issuing moves eggs out of the warehouse; closing puts the unsold eggs back.
 * Broken and missing eggs are booked as expenses at cost, so net profit stays honest.
 */
@Service @RequiredArgsConstructor
public class DispatchService {
    private final DispatchRepository dispatches;
    private final ProductRepository products;
    private final UserRepository users;
    private final ExpenseRepository expenses;

    /** Gives eggs to a salesperson. If they already have an open load this tops it up. */
    @Transactional
    public DispatchView issue(IssueRequest r) {
        AuthUser admin = CurrentUser.require();
        User sp = users.findById(r.salespersonId()).orElseThrow(() -> ApiException.notFound("Salesperson not found"));
        if (!sp.isActive()) throw ApiException.bad(sp.getFullName() + " is not active");
        if (sp.getRole() != Role.CASHIER) throw ApiException.bad("Stock can only be issued to a salesperson");

        Long id = dispatches.openIdFor(sp.getId()).orElseGet(() -> dispatches.create(sp.getId(), admin.id(), r.note()));
        dispatches.lock(id);
        for (var l : r.items()) {
            Product p = products.lockById(l.productId()).orElseThrow(() -> ApiException.notFound("Product not found"));
            BigDecimal eggs = l.unit() == SaleUnit.TRAY ? l.qty().multiply(BigDecimal.valueOf(p.getPiecesPerTray())) : l.qty();
            if (p.getStockQty().compareTo(eggs) < 0) throw ApiException.bad("Not enough " + p.getName() + " in the warehouse");
            p.setStockQty(p.getStockQty().subtract(eggs));
            dispatches.addIssued(id, p.getId(), eggs);
        }
        return dispatches.find(id).orElseThrow();
    }

    /** End of the trip: unsold eggs go back to the warehouse, broken and missing eggs become expenses. */
    @Transactional
    public DispatchView close(Long id, CloseDispatchRequest r) {
        AuthUser admin = CurrentUser.require();
        String status = dispatches.lock(id).orElseThrow(() -> ApiException.notFound("Load not found"));
        if (!status.equals("OPEN")) throw ApiException.bad("This load is already closed");

        var view = dispatches.find(id).orElseThrow();
        for (var item : view.items()) {
            var line = r.items().stream().filter(l -> l.productId().equals(item.productId())).findFirst();
            BigDecimal ret = line.map(CloseDispatchRequest.Line::returned).orElse(BigDecimal.ZERO);
            BigDecimal broken = line.map(CloseDispatchRequest.Line::broken).orElse(BigDecimal.ZERO);
            BigDecimal missing = item.remaining().subtract(ret).subtract(broken);
            if (missing.signum() < 0) throw ApiException.bad("More " + item.name() + " returned than was left in the load (" + item.remaining().stripTrailingZeros().toPlainString() + " " + item.unit() + ")");

            Product p = products.lockById(item.productId()).orElseThrow();
            p.setStockQty(p.getStockQty().add(ret));
            dispatches.setClosingQty(id, item.productId(), ret, broken);
            loss(id, admin.id(), DispatchRepository.BROKEN, item.name(), item.unit(), broken, p.getAvgCost());
            loss(id, admin.id(), DispatchRepository.MISSING, item.name(), item.unit(), missing, p.getAvgCost());
        }
        dispatches.close(id, admin.id(), r.cashCounted(), r.note());
        return dispatches.find(id).orElseThrow();
    }

    private void loss(Long dispatchId, Long by, String category, String productName, String unit, BigDecimal eggs, BigDecimal avgCost) {
        if (eggs.signum() <= 0) return;
        BigDecimal amount = round(eggs.multiply(avgCost).setScale(4, RoundingMode.HALF_UP));
        if (amount.signum() <= 0) return;
        Expense e = new Expense();
        e.setClientId("load-" + dispatchId + "-" + category.charAt(0) + "-" + productName.hashCode());
        e.setCategory(category);
        e.setAmount(amount);
        e.setNote(eggs.stripTrailingZeros().toPlainString() + " " + unit + " of " + productName + " (load #" + dispatchId + ")");
        e.setDispatchId(dispatchId);
        e.setCreatedBy(by);
        expenses.save(e);
    }

    @Transactional(readOnly = true)
    public DispatchView get(Long id) {
        DispatchView v = dispatches.find(id).orElseThrow(() -> ApiException.notFound("Load not found"));
        AuthUser u = CurrentUser.require();
        if (u.role() == Role.CASHIER && !v.salespersonId().equals(u.id())) throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "This is not your load");
        return v;
    }

    @Transactional(readOnly = true)
    public List<DispatchView> all() { return dispatches.all(200); }

    /** The salesperson's own open load (null when none) plus recent history. */
    @Transactional(readOnly = true)
    public List<DispatchView> mine() { return dispatches.forSalesperson(CurrentUser.require().id(), 30); }
}
