package com.shop.sales.dto;

import java.math.BigDecimal;
import java.time.Instant;

/** One line of the ledger. kind: SALE, PAYMENT, EXPENSE, PURCHASE, ISSUE, RETURN. amount is money (or eggs for ISSUE/RETURN). */
public record TransactionRow(String kind, Long id, Instant at, BigDecimal amount, String title, String detail,
                             String method, Long userId, String userName, Long dispatchId) {}
