package com.shop.sales.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record ExpenseRequest(@NotBlank String clientId, @NotBlank String category, @NotNull @Positive BigDecimal amount, String note, Long dispatchId, String employee) {}
