package com.shop.sales.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record ProductRequest(@NotBlank String name, @NotNull @PositiveOrZero BigDecimal sellingPrice, BigDecimal trayPrice,
    @PositiveOrZero BigDecimal costPerTray, @PositiveOrZero BigDecimal trays, Integer perTray) {}
