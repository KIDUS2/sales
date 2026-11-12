package com.shop.sales.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/** Edit the catalogue details. Stock and cost change only through purchases and adjustments. */
public record ProductUpdateRequest(@NotBlank String name, @NotNull @PositiveOrZero BigDecimal sellingPrice,
                                   @PositiveOrZero BigDecimal trayPrice, @Positive Integer perTray) {}
