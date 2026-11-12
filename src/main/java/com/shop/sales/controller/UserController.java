package com.shop.sales.controller;

import com.shop.sales.dto.*;
import com.shop.sales.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/users") @RequiredArgsConstructor
public class UserController {
    private final UserService service;

    @GetMapping public List<UserResponse> list() { return service.list(); }
    @GetMapping("/{id}") public UserResponse get(@PathVariable Long id) { return service.get(id); }
    @PutMapping("/{id}") public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest r) { return service.update(id, r); }
    @PatchMapping("/{id}/role") public UserResponse role(@PathVariable Long id, @Valid @RequestBody ChangeRoleRequest r) { return service.changeRole(id, r.role()); }
    @PostMapping("/{id}/activate") public UserResponse activate(@PathVariable Long id) { return service.setActive(id, true); }
    @PostMapping("/{id}/deactivate") public UserResponse deactivate(@PathVariable Long id) { return service.setActive(id, false); }

    @PostMapping("/{id}/change-password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@PathVariable Long id, @Valid @RequestBody ChangePasswordRequest r) { service.changePassword(id, r); }

    @PostMapping("/{id}/reset-password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest r) { service.resetPassword(id, r); }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
