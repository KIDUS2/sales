package com.shop.sales.service;
import com.shop.sales.dto.*;
import com.shop.sales.repository.ReportRepository;
import java.math.BigDecimal;
import java.time.*;
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
}
