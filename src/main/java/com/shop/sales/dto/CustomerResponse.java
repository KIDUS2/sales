package com.shop.sales.dto;
import com.shop.sales.model.Customer;
import java.math.BigDecimal;
public record CustomerResponse(Long id, String name, String phone, String type, BigDecimal creditLimit, BigDecimal balance, String oldestDebt) {
  public static CustomerResponse from(CustomerRow r) {
    return new CustomerResponse(r.getId(), r.getName(), r.getPhone(), r.getType(), r.getCreditLimit(), r.getBalance(), r.getOldestDebt());
  }
  public static CustomerResponse from(Customer c) {
    return new CustomerResponse(c.getId(), c.getName(), c.getPhone(), c.getType().name(), c.getCreditLimit(), BigDecimal.ZERO, null);
  }
}
