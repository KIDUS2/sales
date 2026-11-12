package com.shop.sales.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** One load of eggs given to a salesperson, with everything that happened to it. Quantities are single eggs. */
public record DispatchView(Long id, Long salespersonId, String salespersonName, String status, String note,
                           Instant openedAt, Instant closedAt, BigDecimal cashCounted,
                           List<Item> items, Totals totals) {

    public record Item(Long productId, String name, int piecesPerTray, String unit, String packName, BigDecimal issued, BigDecimal sold,
                       BigDecimal returned, BigDecimal broken, BigDecimal remaining) {}

    /** cashExpected = cash collected - trip expenses paid from that cash. */
    public record Totals(BigDecimal salesTotal, BigDecimal creditGiven, BigDecimal cashCollected, BigDecimal otherCollected,
                         BigDecimal tripExpenses, BigDecimal cashExpected, BigDecimal lossCost) {}
}
