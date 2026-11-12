package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/purchases") @RequiredArgsConstructor
public class PurchaseController {
  private final PurchaseService service;
  @PostMapping public PurchaseResponse receive(@Valid @RequestBody PurchaseRequest r) { return service.receive(r); }
}
