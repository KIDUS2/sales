package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.model.*;
import com.shop.sales.repository.CustomerRepository;
import com.shop.sales.util.Money;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class CustomerService {
  private final CustomerRepository customers;

  @Transactional(readOnly = true)
  public List<CustomerResponse> list() { return customers.findAllWithBalance().stream().map(CustomerResponse::from).toList(); }

  @Transactional
  public CustomerResponse create(CustomerRequest r) {
    Customer c = new Customer();
    c.setName(r.name());
    c.setPhone(r.phone());
    c.setType(r.type() == null ? CustomerType.SHOP : r.type());
    c.setCreditLimit(Money.nz(r.creditLimit()));
    return CustomerResponse.from(customers.save(c));
  }
}
