package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.repository.ReportRepository;
import java.math.BigDecimal;
import com.shop.sales.exception.ApiException;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ReportService {
  private static final ZoneId SHOP_ZONE = ZoneId.of("Africa/Addis_Ababa");
  private final ReportRepository reports;

  /** Net sales = sales - discounts. Gross profit = net sales - cost of eggs sold. Net profit = gross profit - all expenses. */
  @Transactional(readOnly = true)
  public DailyReport daily(LocalDate date) {
    LocalDate d = date == null ? LocalDate.now(SHOP_ZONE) : date;
    BigDecimal[] gc = reports.grossAndCogs(d);
    BigDecimal discounts = reports.discounts(d), expenses = reports.expenses(d);
    BigDecimal netSales = gc[0].subtract(discounts), grossProfit = netSales.subtract(gc[1]);
    return new DailyReport(d, gc[0], discounts, netSales, gc[1], grossProfit, expenses, grossProfit.subtract(expenses),
        reports.cashReceived(d), reports.supplierPaid(d), reports.creditGiven(d), reports.expenseLines(d));
  }

  @Transactional(readOnly = true)
  public List<ProductSales> byProduct(LocalDate date) { return reports.byProduct(date == null ? LocalDate.now(SHOP_ZONE) : date); }

  /** Net sales = sales - discounts. Gross profit = net sales - cost of eggs sold. Net profit = gross profit - all expenses. */
  @Transactional(readOnly = true)
  public RangeReport range(LocalDate from, LocalDate to) {
    LocalDate b = to == null ? LocalDate.now(SHOP_ZONE) : to;
    LocalDate a = from == null ? b.minusDays(6) : from;
    if (a.isAfter(b)) throw ApiException.bad("The start date is after the end date");
    if (ChronoUnit.DAYS.between(a, b) > 366) throw ApiException.bad("Choose a range of one year or less");

    BigDecimal[] gc = reports.grossAndCogs(a, b);
    BigDecimal discounts = reports.discounts(a, b), expenses = reports.expenses(a, b);
    BigDecimal netSales = gc[0].subtract(discounts), grossProfit = netSales.subtract(gc[1]);
    long count = reports.salesCount(a, b);
    BigDecimal avg = count == 0 ? BigDecimal.ZERO : netSales.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    BigDecimal margin = netSales.signum() == 0 ? BigDecimal.ZERO : grossProfit.multiply(BigDecimal.valueOf(100)).divide(netSales, 1, RoundingMode.HALF_UP);

    var totals = new RangeReport.Totals(gc[0], discounts, netSales, gc[1], grossProfit, expenses, grossProfit.subtract(expenses),
        reports.cashReceived(a, b), reports.supplierPaid(a, b), reports.creditGiven(a, b), count, avg, margin);
    return new RangeReport(a, b, totals, reports.days(a, b), reports.byProduct(a, b), reports.byCustomer(a, b),
        reports.expenseLines(a, b), reports.byMethod(a, b), reports.debts());
  }
}
