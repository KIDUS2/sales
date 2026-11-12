package com.shop.sales.dto;
import com.shop.sales.model.Sale;
import java.math.BigDecimal;
public record SaleResponse(Long id, String status, BigDecimal total, BigDecimal owing, boolean duplicate) {
  public static SaleResponse from(Sale s, boolean duplicate) { return new SaleResponse(s.getId(), s.getStatus().name(), s.getTotal(), s.owing(), duplicate); }
}
