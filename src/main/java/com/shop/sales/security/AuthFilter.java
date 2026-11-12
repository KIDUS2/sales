package com.shop.sales.security;

import com.shop.sales.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Every /api call needs a valid token and a role that is allowed to make that call. The screens themselves are public files. */
@Component @RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {
    public static final String ATTR = "authUser";
    private final TokenService tokens;
    private final UserRepository users;

    @Override protected boolean shouldNotFilter(HttpServletRequest req) { return !req.getRequestURI().startsWith("/api/"); }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI(), method = req.getMethod();
        if (method.equals("OPTIONS") || isPublic(path, method)) { chain.doFilter(req, res); return; }
        AuthUser user = tokens.verify(bearer(req));
        if (user == null) { deny(res, 401, "Please log in again"); return; }
        if (!AccessRules.allowed(user.role(), method, path)) { deny(res, 403, "You do not have permission to do this"); return; }
        req.setAttribute(ATTR, user);
        chain.doFilter(req, res);
    }

    /** Login and the setup check are open. Registering is open only until the first owner exists. */
    private boolean isPublic(String path, String method) {
        if (path.equals("/api/auth/login") || path.equals("/api/auth/status")) return true;
        return path.equals("/api/auth/register") && method.equals("POST") && users.count() == 0;
    }

    public static String bearer(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        return h != null && h.startsWith("Bearer ") ? h.substring(7).trim() : null;
    }

    private static void deny(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
