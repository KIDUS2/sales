package com.shop.sales.dto;
import java.math.BigDecimal;
public record PaymentResponse(BigDecimal applied, BigDecimal advanceCredit, boolean duplicate) {}
