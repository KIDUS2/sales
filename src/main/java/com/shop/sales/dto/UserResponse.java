package com.shop.sales.dto;

import com.shop.sales.model.User;
import java.time.Instant;
public record UserResponse(Long id, String fullName, String phone, String email, String role, boolean active, Instant createdAt) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(), u.getRole().name(), u.isActive(), u.getCreatedAt());
    }
}