package com.shop.sales.security;

import com.shop.sales.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

public final class CurrentUser {
    private CurrentUser() {}

    public static AuthUser get() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        return attrs == null ? null : (AuthUser) attrs.getAttribute(AuthFilter.ATTR, RequestAttributes.SCOPE_REQUEST);
    }

    public static AuthUser require() {
        AuthUser u = get();
        if (u == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Please log in again");
        return u;
    }
}
