package com.shop.sales.security;

import com.shop.sales.enumuration.Role;

/**
 * Who may call what. OWNER (admin) can do everything. MANAGER can do everything except manage users.
 * CASHIER (salesperson) can only sell from the stock issued to them, collect payments, add trip expenses and see their own load.
 */
public final class AccessRules {
    private AccessRules() {}

    public static boolean allowed(Role role, String method, String path) {
        if (path.equals("/api/auth/me") || path.equals("/api/auth/logout")) return true;
        return switch (role) {
            case OWNER -> true;
            case MANAGER -> !(path.startsWith("/api/users") || path.equals("/api/auth/register"));
            case CASHIER -> salesperson(method, path);
        };
    }

    private static boolean salesperson(String method, String path) {
        boolean get = method.equals("GET"), post = method.equals("POST");
        return switch (path) {
            case "/api/products", "/api/dispatches/mine", "/api/transactions" -> get;
            case "/api/customers" -> get || post;
            case "/api/sales", "/api/payments", "/api/expenses" -> post;
            default -> false;
        };
    }
}
