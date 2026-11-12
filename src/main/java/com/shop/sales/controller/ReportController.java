package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.ReportService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/reports") @RequiredArgsConstructor
public class ReportController {
  private final ReportService service;
  @GetMapping("/daily") public DailyReport daily(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) { return service.daily(date); }
  @GetMapping("/products") public List<ProductSales> products(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) { return service.byProduct(date); }
  @GetMapping("/summary") public RangeReport summary(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) { return service.range(from, to); }
}
