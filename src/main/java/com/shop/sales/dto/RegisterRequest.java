package com.shop.sales.dto;

import jakarta.validation.constraints.*;
public record RegisterRequest(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank @Pattern(regexp = "^(\\+251|251|0)?[79]\\d{8}$", message = "must be an Ethiopian mobile number, e.g. 0912345678")
        String phone,
        @Email String email,
        @NotBlank @Size(min = 8, max = 72, message = "must be 8 to 72 characters") String password) {}
