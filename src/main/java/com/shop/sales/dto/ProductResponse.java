package com.shop.sales.dto;
import com.shop.sales.model.Product;
import java.math.BigDecimal;
public record ProductResponse(Long id, String name, int ppt, BigDecimal sellingPrice, BigDecimal trayPrice, BigDecimal cost, BigDecimal stock) {
  public static ProductResponse from(Product p) {
    return new ProductResponse(p.getId(), p.getName(), p.getPiecesPerTray(), p.getSellingPrice(), p.getTrayPrice(), p.getAvgCost(), p.getStockQty());
  }
}
