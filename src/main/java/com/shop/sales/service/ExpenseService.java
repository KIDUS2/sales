package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.enumuration.Role;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.Expense;
import com.shop.sales.repository.DispatchRepository;
import com.shop.sales.repository.ExpenseRepository;
import com.shop.sales.security.AuthUser;
import com.shop.sales.security.CurrentUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ExpenseService {
  private final ExpenseRepository expenses;
  private final DispatchRepository dispatches;
  /** What a salesperson may spend on the road. Payroll, rent and the like are for the admin. */
  private static final List<String> TRIP = List.of("Fuel", "Transport", "Loading", "Meals", "Other");

  @Transactional
  public Ack add(ExpenseRequest r) {
    if (expenses.existsByClientId(r.clientId())) return new Ack(true, true);
    AuthUser user = CurrentUser.get();
    Long dispatchId = r.dispatchId();
    if (user != null && user.role() == Role.CASHIER) {
      if (!TRIP.contains(r.category())) throw ApiException.bad("You can only record trip expenses: " + String.join(", ", TRIP));
      dispatchId = dispatches.openIdFor(user.id()).orElseThrow(() -> ApiException.bad("You have no open load"));
    }
    if (r.category().equals(DispatchRepository.BROKEN) || r.category().equals(DispatchRepository.MISSING))
      if (dispatchId != null) throw ApiException.bad("Broken and missing eggs are recorded when the load is closed");

    String employee = r.employee() == null ? "" : r.employee().trim();
    if (r.category().equals("Payroll") && employee.isEmpty()) throw ApiException.bad("Enter the name of the employee who was paid");

    Expense e = new Expense();
    e.setEmployee(employee.isEmpty() ? null : employee);
    e.setDispatchId(dispatchId);
    e.setCreatedBy(user == null ? null : user.id());
    e.setClientId(r.clientId());
    e.setCategory(r.category());
    e.setAmount(r.amount());
    e.setNote(r.note());
    expenses.save(e);
    return new Ack(true, false);
  }
}
