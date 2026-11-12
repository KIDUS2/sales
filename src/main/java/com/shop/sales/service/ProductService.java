package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.model.Product;
import com.shop.sales.repository.ProductRepository;
import com.shop.sales.util.Money;
import java.math.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ProductService {
  private final ProductRepository products;

  @Transactional(readOnly = true)
  public List<ProductResponse> list() { return products.findByActiveTrueOrderByName().stream().map(ProductResponse::from).toList(); }

  @Transactional
  public ProductResponse create(ProductRequest r) {
    int ppt = r.perTray() == null || r.perTray() <= 0 ? 30 : r.perTray();
    Product p = new Product();
    p.setName(r.name());
    p.setSellingPrice(r.sellingPrice());
    p.setTrayPrice(r.trayPrice());
    p.setPiecesPerTray(ppt);
    p.setAvgCost(Money.nz(r.costPerTray()).divide(BigDecimal.valueOf(ppt), 4, RoundingMode.HALF_UP));
    p.setStockQty(Money.nz(r.trays()).multiply(BigDecimal.valueOf(ppt)));
    return ProductResponse.from(products.save(p));
  }
}
