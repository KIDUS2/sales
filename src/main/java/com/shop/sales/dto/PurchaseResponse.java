package com.shop.sales.dto;
import java.math.BigDecimal;
public record PurchaseResponse(BigDecimal avgCostPerEgg, boolean duplicate) {}
