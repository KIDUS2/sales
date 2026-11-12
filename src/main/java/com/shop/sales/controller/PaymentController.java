package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/payments") @RequiredArgsConstructor
public class PaymentController {
  private final PaymentService service;
  @PostMapping public PaymentResponse receive(@Valid @RequestBody PaymentRequest r) { return service.receive(r); }
}
