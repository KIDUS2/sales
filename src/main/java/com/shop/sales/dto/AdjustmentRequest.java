package com.shop.sales.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record AdjustmentRequest(@NotBlank String clientId, @NotNull Long productId, @NotNull @Positive BigDecimal pieces, @NotBlank String reason) {}
