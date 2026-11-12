package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.*;
import com.shop.sales.enumuration.Role;
import com.shop.sales.security.AuthUser;
import com.shop.sales.security.CurrentUser;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class PaymentService {
  private final PaymentRepository payments;
  private final SaleRepository sales;
  private final CustomerRepository customers;
  private final DispatchRepository dispatches;

  /** A later payment is not a new sale. It is spread over the oldest unpaid sales first. */
  @Transactional
  public PaymentResponse receive(PaymentRequest r) {
    if (payments.existsByClientId(r.clientId())) return new PaymentResponse(BigDecimal.ZERO, BigDecimal.ZERO, true);
    if (!customers.existsById(r.customerId())) throw ApiException.notFound("Customer not found");

    AuthUser user = CurrentUser.get();
    Long dispatchId = null;
    if (user != null && user.role() == Role.CASHIER)   // money a salesperson collects belongs to their load
      dispatchId = dispatches.openIdFor(user.id()).orElseThrow(() -> ApiException.bad("You have no open load"));

    Payment p = new Payment();
    p.setDispatchId(dispatchId);
    p.setReceivedBy(user == null ? null : user.id());
    p.setClientId(r.clientId());
    p.setCustomerId(r.customerId());
    p.setAmount(r.amount());
    p.setMethod(r.method() == null ? PaymentMethod.CASH : r.method());
    payments.save(p);

    BigDecimal left = r.amount();
    for (Sale s : sales.findOpenForUpdate(r.customerId(), List.of(SaleStatus.CREDIT, SaleStatus.PARTIAL))) {
      if (left.signum() <= 0) break;
      BigDecimal take = s.owing().min(left);
      s.setPaidAmount(s.getPaidAmount().add(take));
      s.setStatus(s.owing().signum() == 0 ? SaleStatus.PAID : SaleStatus.PARTIAL);
      left = left.subtract(take);
    }
    return new PaymentResponse(r.amount().subtract(left), left, false);   // left over = advance credit
  }
}
