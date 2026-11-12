package com.shop.sales.service;
import static com.shop.sales.util.Money.*;
import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.*;
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

  /** One database transaction: sale, lines, stock and the payment made now. Safe to send twice (clientId). */
  @Transactional
  public SaleResponse create(SaleRequest r) {
    var existing = sales.findByClientId(r.clientId());
    if (existing.isPresent()) return SaleResponse.from(existing.get(), true);

    BigDecimal subtotal = BigDecimal.ZERO;
    for (var i : r.items()) subtotal = subtotal.add(i.price().multiply(i.qty()));
    subtotal = round(subtotal);
    BigDecimal discount = nz(r.discount());
    if (discount.compareTo(subtotal) > 0) throw ApiException.bad("Discount is bigger than the sale");
    BigDecimal total = subtotal.subtract(discount);
    BigDecimal paid = nz(r.paid()).min(total);
    BigDecimal owing = total.subtract(paid);
    if (owing.signum() > 0) checkCredit(r.customerId(), owing);

    Sale sale = new Sale();
    sale.setClientId(r.clientId());
    sale.setCustomerId(r.customerId());
    sale.setDiscount(discount);
    sale.setTotal(total);
    sale.setPaidAmount(paid);
    sale.setStatus(owing.signum() == 0 ? SaleStatus.PAID : paid.signum() == 0 ? SaleStatus.CREDIT : SaleStatus.PARTIAL);

    for (var i : r.items()) {
      Product p = products.lockById(i.productId()).orElseThrow(() -> ApiException.notFound("Product " + i.productId() + " not found"));
      boolean tray = i.unit() == SaleUnit.TRAY;
      BigDecimal pieces = tray ? i.qty().multiply(BigDecimal.valueOf(p.getPiecesPerTray())) : i.qty();
      BigDecimal line = round(i.price().multiply(i.qty()));
      SaleItem item = new SaleItem();
      item.setProductId(p.getId());
      item.setQty(pieces);
      item.setUnitPrice(line.divide(pieces, 4, RoundingMode.HALF_UP));
      item.setUnitCost(p.getAvgCost());          // cost frozen on the line, old reports never change
      item.setPackUnit(i.unit());
      item.setPackQty(i.qty());
      item.setLineTotal(line);
      sale.addItem(item);
      p.setStockQty(p.getStockQty().subtract(pieces));
    }
    sales.saveAndFlush(sale);

    if (paid.signum() > 0) {
      Payment pay = new Payment();
      pay.setClientId(r.clientId() + "-p");
      pay.setCustomerId(r.customerId());
      pay.setSaleId(sale.getId());
      pay.setAmount(paid);
      pay.setMethod(r.method() == null ? PaymentMethod.CASH : r.method());
      payments.save(pay);
    }
    return SaleResponse.from(sale, false);
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
    for (SaleItem i : s.getItems()) products.lockById(i.getProductId()).ifPresent(p -> p.setStockQty(p.getStockQty().add(i.getQty())));
    s.setStatus(SaleStatus.VOID);
    s.setVoidReason(reason);
  }
}
