package com.shop.sales.controller;

import com.shop.sales.dto.*;
import com.shop.sales.security.AuthFilter;
import com.shop.sales.security.CurrentUser;
import com.shop.sales.service.AuthService;
import com.shop.sales.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final UserService users;
    private final AuthService auth;

    /** The screen asks this first: if no user exists yet it shows "create the owner account" instead of the login form. */
    @GetMapping("/status") public Map<String, Boolean> status() { return Map.of("setupNeeded", auth.setupNeeded()); }

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest r) { return users.register(r); }

    @PostMapping("/login") public LoginResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }

    @GetMapping("/me") public UserResponse me() { return users.get(CurrentUser.require().id()); }

    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest req) { auth.logout(AuthFilter.bearer(req)); }
}
