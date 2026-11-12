package com.shop.sales.dto;
import com.shop.sales.model.SaleUnit;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record SaleItemRequest(@NotNull Long productId, @NotNull SaleUnit unit, @NotNull @Positive BigDecimal qty, @NotNull @PositiveOrZero BigDecimal price) {}
