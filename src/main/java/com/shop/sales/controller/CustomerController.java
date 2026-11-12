package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.CustomerService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/customers") @RequiredArgsConstructor
public class CustomerController {
  private final CustomerService service;
  @GetMapping public List<CustomerResponse> list() { return service.list(); }
  @PostMapping public CustomerResponse create(@Valid @RequestBody CustomerRequest r) { return service.create(r); }
}
