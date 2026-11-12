package com.shop.sales.security;

import com.shop.sales.model.User;
import com.shop.sales.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Random login tokens. Only the SHA-256 hash is stored, so a leaked database cannot be used to log in. */
@Service @RequiredArgsConstructor
public class TokenService {
    private final JdbcTemplate db;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();

    public String issue(Long userId) {
        byte[] raw = new byte[32];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        db.update("INSERT INTO auth_tokens(token_hash, user_id, expires_at) VALUES (?,?, now() + interval '30 days')", hash(token), userId);
        return token;
    }

    /** Returns the user for a valid token, or null. Inactive users are always refused, so deactivating locks them out at once. */
    public AuthUser verify(String token) {
        if (token == null || token.isBlank()) return null;
        var ids = db.queryForList("SELECT user_id FROM auth_tokens WHERE token_hash=? AND expires_at > now()", Long.class, hash(token));
        if (ids.isEmpty()) return null;
        return users.findById(ids.get(0)).filter(User::isActive).map(u -> new AuthUser(u.getId(), u.getFullName(), u.getRole())).orElse(null);
    }

    public void revoke(String token) { if (token != null) db.update("DELETE FROM auth_tokens WHERE token_hash=?", hash(token)); }
    public void revokeAll(Long userId) { db.update("DELETE FROM auth_tokens WHERE user_id=?", userId); }
    public void purgeExpired() { db.update("DELETE FROM auth_tokens WHERE expires_at < now()"); }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
