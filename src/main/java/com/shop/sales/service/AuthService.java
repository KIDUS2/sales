package com.shop.sales.service;

import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.User;
import com.shop.sales.repository.UserRepository;
import com.shop.sales.security.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    @Transactional(readOnly = true)
    public boolean setupNeeded() { return users.count() == 0; }

    @Transactional
    public LoginResponse login(LoginRequest r) {
        if (r.phone().replaceAll("[^0-9]", "").length() < 9) throw ApiException.bad("Enter your phone number, for example 0912345678");
        User u = users.findByPhone(UserService.normalizePhone(r.phone())).orElse(null);
        // the same message for every failure, so nobody can find out which phone numbers exist
        if (u == null || !u.isActive() || !encoder.matches(r.password(), u.getPasswordHash()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Wrong phone number or password");
        tokens.purgeExpired();
        return new LoginResponse(tokens.issue(u.getId()), UserResponse.from(u));
    }

    @Transactional
    public void logout(String token) { tokens.revoke(token); }
}
