package com.shop.sales.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record PurchaseRequest(@NotBlank String clientId, @NotNull Long productId, String supplier, @NotNull @Positive BigDecimal trays,
    @NotNull @Positive BigDecimal costPerTray, @PositiveOrZero BigDecimal paid) {}
