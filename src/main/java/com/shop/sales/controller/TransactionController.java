package com.shop.sales.controller;

import com.shop.sales.dto.TransactionRow;
import com.shop.sales.enumuration.Role;
import com.shop.sales.repository.TransactionRepository;
import com.shop.sales.security.AuthUser;
import com.shop.sales.security.CurrentUser;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/transactions") @RequiredArgsConstructor
public class TransactionController {
    private final TransactionRepository repo;

    /** Admin sees everything (optionally for one person). A salesperson only ever sees their own, whatever they ask for. */
    @GetMapping
    public List<TransactionRow> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                     @RequestParam(required = false) String type, @RequestParam(required = false) Long userId,
                                     @RequestParam(defaultValue = "300") int limit) {
        AuthUser u = CurrentUser.require();
        LocalDate today = LocalDate.now(ZoneId.of("Africa/Addis_Ababa"));
        Long who = u.role() == Role.CASHIER ? u.id() : userId;
        return repo.find(from == null ? today.minusDays(30) : from, to == null ? today : to, type, who, limit);
    }
}
