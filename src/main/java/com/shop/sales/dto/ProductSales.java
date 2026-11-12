package com.shop.sales.dto;
import java.math.BigDecimal;
public record ProductSales(String name, BigDecimal qty, BigDecimal revenue, BigDecimal cost, BigDecimal profit) {}
