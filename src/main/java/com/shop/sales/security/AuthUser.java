package com.shop.sales.security;

import com.shop.sales.enumuration.Role;

/** The logged-in user for the current request. */
public record AuthUser(Long id, String name, Role role) {}
