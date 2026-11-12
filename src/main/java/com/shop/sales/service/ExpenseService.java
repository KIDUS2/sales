package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.model.Expense;
import com.shop.sales.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ExpenseService {
  private final ExpenseRepository expenses;

  @Transactional
  public Ack add(ExpenseRequest r) {
    if (expenses.existsByClientId(r.clientId())) return new Ack(true, true);
    Expense e = new Expense();
    e.setClientId(r.clientId());
    e.setCategory(r.category());
    e.setAmount(r.amount());
    e.setNote(r.note());
    expenses.save(e);
    return new Ack(true, false);
  }
}
