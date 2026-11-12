package com.shop.sales.dto;

import com.shop.sales.model.SaleUnit;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record IssueRequest(@NotNull Long salespersonId, String note, @NotEmpty @Valid List<Line> items) {
    public record Line(@NotNull Long productId, @NotNull SaleUnit unit, @NotNull @Positive BigDecimal qty) {}
}
