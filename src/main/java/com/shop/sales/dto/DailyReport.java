package com.shop.sales.dto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
public record DailyReport(LocalDate date, BigDecimal grossSales, BigDecimal discounts, BigDecimal netSales, BigDecimal cogs, BigDecimal grossProfit,
    BigDecimal expenses, BigDecimal netProfit, BigDecimal cashReceived, BigDecimal supplierPaid, BigDecimal creditGiven, List<ExpenseLine> expenseList) {}
