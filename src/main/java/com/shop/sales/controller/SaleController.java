package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/sales") @RequiredArgsConstructor
public class SaleController {
  private final SaleService service;
  @PostMapping public SaleResponse create(@Valid @RequestBody SaleRequest r) { return service.create(r); }
  @PostMapping("/{id}/void") public Ack voidSale(@PathVariable Long id, @RequestParam(defaultValue = "no reason") String reason) {
    service.voidSale(id, reason);
    return new Ack(true, false);
  }
}
