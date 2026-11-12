package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/expenses") @RequiredArgsConstructor
public class ExpenseController {
  private final ExpenseService service;
  @PostMapping public Ack add(@Valid @RequestBody ExpenseRequest r) { return service.add(r); }
}
