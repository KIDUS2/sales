package com.shop.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

/** returned and broken are single eggs. Whatever is left over is counted as missing. */
public record CloseDispatchRequest(@PositiveOrZero BigDecimal cashCounted, String note, @NotNull @Valid List<Line> items) {
    public record Line(@NotNull Long productId, @NotNull @PositiveOrZero BigDecimal returned, @NotNull @PositiveOrZero BigDecimal broken) {}
}
