package com.shop.sales.dto;
import com.shop.sales.model.PaymentMethod;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record PaymentRequest(@NotBlank String clientId, @NotNull Long customerId, @NotNull @Positive BigDecimal amount, PaymentMethod method) {}
