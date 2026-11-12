package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/adjustments") @RequiredArgsConstructor
public class StockController {
  private final StockService service;
  @PostMapping public Ack adjust(@Valid @RequestBody AdjustmentRequest r) { return service.adjust(r); }
}
