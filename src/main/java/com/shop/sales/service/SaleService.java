package com.shop.sales.service;
import static com.shop.sales.util.Money.*;
import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.*;
import com.shop.sales.enumuration.Role;
import com.shop.sales.security.AuthUser;
import com.shop.sales.security.CurrentUser;
import java.util.HashMap;
import java.util.Map;
import java.math.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class SaleService {
  private final SaleRepository sales;
  private final ProductRepository products;
  private final CustomerRepository customers;
  private final PaymentRepository payments;
  private final DispatchRepository dispatches;

  /** One database transaction: sale, lines, stock and the payment made now. Safe to send twice (clientId). */
  @Transactional
  public SaleResponse create(SaleRequest r) {
    var existing = sales.findByClientId(r.clientId());
    if (existing.isPresent()) return SaleResponse.from(existing.get(), true);

    AuthUser user = CurrentUser.get();
    boolean fromLoad = user != null && user.role() == Role.CASHIER;   // a salesperson sells only from the stock issued to them
    Long dispatchId = null;
    if (fromLoad) {
      dispatchId = dispatches.openIdFor(user.id()).orElseThrow(() -> ApiException.bad("You have no stock to sell. Ask the admin to give you a load first."));
      dispatches.lock(dispatchId);
    }

    Map<Long, Product> locked = new HashMap<>();
    for (var i : r.items()) locked.computeIfAbsent(i.productId(), id -> products.lockById(id).orElseThrow(() -> ApiException.notFound("Product " + id + " not found")));

    // Prices are the admin's. A salesperson cannot change the price or give a discount: the server ignores what the phone sent.
    Map<SaleItemRequest, BigDecimal> price = new HashMap<>();
    BigDecimal clientSub = BigDecimal.ZERO;
    BigDecimal subtotal = BigDecimal.ZERO;
    for (var i : r.items()) {
      BigDecimal unitPrice = i.price();
      if (fromLoad) {
        Product p = locked.get(i.productId());
        unitPrice = i.unit() == SaleUnit.TRAY ? (p.getTrayPrice() != null ? p.getTrayPrice() : p.getSellingPrice().multiply(BigDecimal.valueOf(p.getPiecesPerTray()))) : p.getSellingPrice();
      }
      price.put(i, unitPrice);
      clientSub = clientSub.add(i.price().multiply(i.qty()));
      subtotal = subtotal.add(unitPrice.multiply(i.qty()));
    }
    subtotal = round(subtotal);
    clientSub = round(clientSub);
    BigDecimal discount = fromLoad ? BigDecimal.ZERO : nz(r.discount());
    if (discount.compareTo(subtotal) > 0) throw ApiException.bad("Discount is bigger than the sale");
    BigDecimal total = subtotal.subtract(discount);
    BigDecimal paid = nz(r.paid());
    // the phone meant "paid in full" but its price list was old: pay the server's total
    if (fromLoad && paid.compareTo(clientSub) >= 0) paid = total;
    paid = paid.min(total);
    BigDecimal owing = total.subtract(paid);
    if (owing.signum() > 0) checkCredit(r.customerId(), owing);

    Sale sale = new Sale();
    sale.setClientId(r.clientId());
    sale.setCustomerId(r.customerId());
    sale.setDispatchId(dispatchId);
    sale.setSoldBy(user == null ? null : user.id());
    sale.setDiscount(discount);
    sale.setTotal(total);
    sale.setPaidAmount(paid);
    sale.setStatus(owing.signum() == 0 ? SaleStatus.PAID : paid.signum() == 0 ? SaleStatus.CREDIT : SaleStatus.PARTIAL);

    for (var i : r.items()) {
      Product p = locked.get(i.productId());
      boolean tray = i.unit() == SaleUnit.TRAY;
      BigDecimal pieces = tray ? i.qty().multiply(BigDecimal.valueOf(p.getPiecesPerTray())) : i.qty();
      BigDecimal line = round(price.get(i).multiply(i.qty()));
      SaleItem item = new SaleItem();
      item.setProductId(p.getId());
      item.setQty(pieces);
      item.setUnitPrice(line.divide(pieces, 4, RoundingMode.HALF_UP));
      item.setUnitCost(p.getAvgCost());          // cost frozen on the line, old reports never change
      item.setPackUnit(i.unit());
      item.setPackQty(i.qty());
      item.setLineTotal(line);
      sale.addItem(item);
      if (fromLoad) {
        // the eggs already left the warehouse when the load was issued, so only the load shrinks
        BigDecimal left = dispatches.remaining(dispatchId, p.getId()).subtract(pendingInThisSale(sale, p.getId()));
        if (left.compareTo(pieces) < 0) throw ApiException.bad("Only " + left.max(BigDecimal.ZERO).stripTrailingZeros().toPlainString() + " eggs of " + p.getName() + " left in your load");
      } else {
        p.setStockQty(p.getStockQty().subtract(pieces));
      }
    }
    sales.saveAndFlush(sale);

    if (paid.signum() > 0) {
      Payment pay = new Payment();
      pay.setClientId(r.clientId() + "-p");
      pay.setCustomerId(r.customerId());
      pay.setSaleId(sale.getId());
      pay.setDispatchId(dispatchId);
      pay.setReceivedBy(user == null ? null : user.id());
      pay.setAmount(paid);
      pay.setMethod(r.method() == null ? PaymentMethod.CASH : r.method());
      payments.save(pay);
    }
    return SaleResponse.from(sale, false);
  }

  /** Eggs of one type already added to this sale object but not yet saved (the same egg type on two lines). */
  private static BigDecimal pendingInThisSale(Sale sale, Long productId) {
    BigDecimal sum = BigDecimal.ZERO;
    for (SaleItem it : sale.getItems()) if (productId.equals(it.getProductId())) sum = sum.add(it.getQty());
    return sum.subtract(sale.getItems().isEmpty() ? BigDecimal.ZERO : lastQty(sale, productId));
  }
  private static BigDecimal lastQty(Sale sale, Long productId) {
    BigDecimal last = BigDecimal.ZERO;
    for (SaleItem it : sale.getItems()) if (productId.equals(it.getProductId())) last = it.getQty();
    return last;
  }

  private void checkCredit(Long customerId, BigDecimal owing) {
    if (customerId == null) throw ApiException.bad("Choose a customer to sell on credit");
    Customer c = customers.findById(customerId).orElseThrow(() -> ApiException.notFound("Customer not found"));
    BigDecimal limit = nz(c.getCreditLimit());
    if (limit.signum() > 0 && customers.balanceOf(customerId).add(owing).compareTo(limit) > 0)
      throw ApiException.bad("Credit limit exceeded for " + c.getName());
  }

  /** Never delete a sale: mark it void and put the eggs back. Money already paid stays as the customer's advance. */
  @Transactional
  public void voidSale(Long id, String reason) {
    Sale s = sales.findById(id).orElseThrow(() -> ApiException.notFound("Sale not found"));
    if (s.getStatus() == SaleStatus.VOID) throw ApiException.bad("Sale is already void");
    if (s.getDispatchId() != null) {
      // eggs go back into the load, not the warehouse, and only while the load is still open
      String st = dispatches.lock(s.getDispatchId()).orElse("CLOSED");
      if (!st.equals("OPEN")) throw ApiException.bad("This sale belongs to a load that is already closed");
      s.setStatus(SaleStatus.VOID);
      s.setVoidReason(reason);
      return;
    }
    for (SaleItem i : s.getItems()) products.lockById(i.getProductId()).ifPresent(p -> p.setStockQty(p.getStockQty().add(i.getQty())));
    s.setStatus(SaleStatus.VOID);
    s.setVoidReason(reason);
  }
}
