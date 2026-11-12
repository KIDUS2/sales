package com.shop.sales.controller;
import com.shop.sales.dto.*;
import com.shop.sales.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/products") @RequiredArgsConstructor
public class ProductController {
  private final ProductService service;
  @GetMapping public List<ProductResponse> list() { return service.list(); }
  @PostMapping public ProductResponse create(@Valid @RequestBody ProductRequest r) { return service.create(r); }
  @PutMapping("/{id}") public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductUpdateRequest r) { return service.update(id, r); }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { service.deactivate(id); }
}
