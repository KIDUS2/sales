package com.shop.sales.dto;

import com.shop.sales.enumuration.Role;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(@NotNull Role role) {}
