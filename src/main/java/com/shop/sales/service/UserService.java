package com.shop.sales.service;

import com.shop.sales.dto.*;
import com.shop.sales.enumuration.Role;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    // ---------- create ----------
    /** The first person to register owns the shop. Everyone after that starts as a cashier. */
    @Transactional
    public UserResponse register(RegisterRequest r) {
        String phone = normalizePhone(r.phone()), email = cleanEmail(r.email());
        if (users.existsByPhone(phone)) throw conflict("This phone number is already registered");
        if (email != null && users.existsByEmail(email)) throw conflict("This email is already registered");

        User u = new User();
        u.setFullName(r.fullName().trim());
        u.setPhone(phone);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(users.count() == 0 ? Role.OWNER : Role.CASHIER);
        return UserResponse.from(users.save(u));
    }

    // ---------- read ----------
    @Transactional(readOnly = true)
    public List<UserResponse> list()
    { return users.findAllByOrderByFullName().stream().map(UserResponse::from).toList(); }

    @Transactional(readOnly = true)
    public UserResponse get(Long id)
    { return UserResponse.from(find(id)); }

    // ---------- update profile ----------
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest r) {
        User u = find(id);
        String phone = normalizePhone(r.phone()), email = cleanEmail(r.email());
        if (users.existsByPhoneAndIdNot(phone, id)) throw conflict("This phone number belongs to another user");
        if (email != null && users.existsByEmailAndIdNot(email, id)) throw conflict("This email belongs to another user");
        u.setFullName(r.fullName().trim());
        u.setPhone(phone);
        u.setEmail(email);
        return UserResponse.from(u);
    }

    @Transactional
    public UserResponse changeRole(Long id, Role role) {
        User u = find(id);
        if (u.getRole() == Role.OWNER && role != Role.OWNER) ensureNotLastOwner(u);
        u.setRole(role);
        return UserResponse.from(u);
    }

    /** Deactivated users cannot log in, but their history stays. */
    @Transactional
    public UserResponse setActive(Long id, boolean active) {
        User u = find(id);
        if (!active) ensureNotLastOwner(u);
        u.setActive(active);
        return UserResponse.from(u);
    }

    // ---------- passwords ----------
    /** The user changes their own password and must know the old one. */
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest r) {
        User u = find(id);
        if (!encoder.matches(r.currentPassword(), u.getPasswordHash())) throw ApiException.bad("Current password is wrong");
        if (r.currentPassword().equals(r.newPassword())) throw ApiException.bad("The new password must be different");
        u.setPasswordHash(encoder.encode(r.newPassword()));
    }

    /** An owner sets a new password for someone who forgot theirs. */
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest r) {
        find(id).setPasswordHash(encoder.encode(r.newPassword()));
    }

    // ---------- delete ----------
    @Transactional
    public void delete(Long id) {
        User u = find(id);
        ensureNotLastOwner(u);
        users.delete(u);
    }

    // ---------- helpers ----------
    private User find(Long id) { return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found")); }

    private void ensureNotLastOwner(User u) {
        if (u.getRole() == Role.OWNER && u.isActive() && users.countByRoleAndActiveTrue(Role.OWNER) <= 1)
            throw ApiException.bad("The shop must keep at least one active owner");
    }

    private static ApiException conflict(String m) { return new ApiException(HttpStatus.CONFLICT, m); }
    private static String cleanEmail(String e) { return e == null || e.isBlank() ? null : e.trim().toLowerCase(); }

    /** 0912345678, 251912345678 and +251912345678 all become +251912345678. */
    static String normalizePhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        return "+251" + digits.substring(digits.length() - 9);
    }
}