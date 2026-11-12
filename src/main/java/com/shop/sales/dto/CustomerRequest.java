package com.shop.sales.dto;
import com.shop.sales.model.CustomerType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record CustomerRequest(@NotBlank String name, String phone, CustomerType type, @PositiveOrZero BigDecimal creditLimit) {}
