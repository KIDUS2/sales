package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
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
    int ppt = r.perTray() == null || r.perTray() <= 0 ? 1 : r.perTray();   // 1 = sold singly, no pack
    Product p = new Product();
    p.setName(r.name());
    p.setSellingPrice(r.sellingPrice());
    p.setTrayPrice(r.trayPrice());
    p.setPiecesPerTray(ppt);
    p.setUnit(label(r.unit(), "piece"));
    p.setPackName(label(r.packName(), "pack"));
    p.setAvgCost(Money.nz(r.costPerTray()).divide(BigDecimal.valueOf(ppt), 4, RoundingMode.HALF_UP));
    p.setStockQty(Money.nz(r.trays()).multiply(BigDecimal.valueOf(ppt)));
    return ProductResponse.from(products.save(p));
  }

  @Transactional
  public ProductResponse update(Long id, ProductUpdateRequest r) {
    Product p = active(id);
    p.setName(r.name().trim());
    p.setSellingPrice(r.sellingPrice());
    p.setTrayPrice(r.trayPrice());
    if (r.perTray() != null) p.setPiecesPerTray(r.perTray());
    p.setUnit(label(r.unit(), p.getUnit()));
    p.setPackName(label(r.packName(), p.getPackName()));
    return ProductResponse.from(p);
  }

  private static String label(String v, String fallback) { return v == null || v.isBlank() ? fallback : v.trim(); }

  /** Never a hard delete: old sales still point at the product, so it is only hidden. */
  @Transactional
  public void deactivate(Long id) { active(id).setActive(false); }

  private Product active(Long id) {
    return products.findById(id).filter(Product::isActive).orElseThrow(() -> ApiException.notFound("Product not found"));
  }
}
