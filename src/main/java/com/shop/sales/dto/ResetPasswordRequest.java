package com.shop.sales.dto;

import jakarta.validation.constraints.*;

public record ResetPasswordRequest(
        @NotBlank @Size(min = 8, max = 72, message = "must be 8 to 72 characters") String newPassword) {}
