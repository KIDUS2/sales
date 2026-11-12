package com.shop.sales.dto;
import com.shop.sales.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
public record SaleRequest(@NotBlank String clientId, Long customerId, @PositiveOrZero BigDecimal discount, @PositiveOrZero BigDecimal paid,
    PaymentMethod method, @NotEmpty @Valid List<SaleItemRequest> items) {}
