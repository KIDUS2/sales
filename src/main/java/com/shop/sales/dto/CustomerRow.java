package com.shop.sales.dto;
import java.math.BigDecimal;
/** Projection for the customer list query (balance is always calculated, never stored). */
public interface CustomerRow {
  Long getId(); String getName(); String getPhone(); String getType();
  BigDecimal getCreditLimit(); BigDecimal getBalance(); String getOldestDebt();
}
