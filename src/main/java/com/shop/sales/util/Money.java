package com.shop.sales.util;
import java.math.BigDecimal;
import java.math.RoundingMode;
public final class Money {
  private Money() {}
  public static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
  public static BigDecimal round(BigDecimal v) { return v.setScale(2, RoundingMode.HALF_UP); }
}
