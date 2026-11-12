package com.shop.sales.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Detailed report for a date range (the debts list is always "as of today"). */
public record RangeReport(LocalDate from, LocalDate to, Totals totals, List<DayPoint> days, List<ProductSales> products,
                          List<CustomerSales> customers, List<ExpenseLine> expenses, List<MethodTotal> methods, List<DebtRow> debts) {

    public record Totals(BigDecimal grossSales, BigDecimal discounts, BigDecimal netSales, BigDecimal cogs, BigDecimal grossProfit,
                         BigDecimal expenses, BigDecimal netProfit, BigDecimal cashReceived, BigDecimal supplierPaid,
                         BigDecimal creditGiven, long salesCount, BigDecimal avgSale, BigDecimal marginPct) {}

    public record DayPoint(LocalDate date, BigDecimal netSales, BigDecimal cogs, BigDecimal expenses, BigDecimal profit) {}

    public record CustomerSales(String name, long orders, BigDecimal total, BigDecimal paid, BigDecimal owing) {}

    public record MethodTotal(String method, BigDecimal amount) {}

    public record DebtRow(String name, String phone, BigDecimal current, BigDecimal days31to60, BigDecimal over60, BigDecimal total) {}
}
