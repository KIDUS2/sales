package com.shop.sales.service;
import static com.shop.sales.util.Money.*;
import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class StockService {
  private final ProductRepository products;
  private final ExpenseRepository expenses;

  /** Broken, spoiled or given-away eggs: stock goes down and the cost of those eggs is booked as an expense. */
  @Transactional
  public Ack adjust(AdjustmentRequest r) {
    if (expenses.existsByClientId(r.clientId())) return new Ack(true, true);
    Product p = products.lockById(r.productId()).orElseThrow(() -> ApiException.notFound("Product not found"));
    Expense e = new Expense();
    e.setClientId(r.clientId());
    e.setCategory(r.reason());
    e.setAmount(round(p.getAvgCost().multiply(r.pieces())));
    e.setNote(r.pieces() + " eggs of " + p.getName());
    expenses.save(e);
    p.setStockQty(p.getStockQty().subtract(r.pieces()));
    return new Ack(true, false);
  }
}
