package com.shop.sales.repository;
import com.shop.sales.dto.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Read-only report queries. Revenue uses line_total; cost uses the cost saved on each sale line. */
@Repository @RequiredArgsConstructor
public class ReportRepository {
  private final JdbcTemplate db;

  private BigDecimal sum(String sql, LocalDate d) { return db.queryForObject(sql, BigDecimal.class, d); }

  public BigDecimal[] grossAndCogs(LocalDate d) {
    return db.queryForObject("""
      SELECT COALESCE(SUM(si.line_total),0), COALESCE(SUM(si.qty*si.unit_cost),0)
      FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.status<>'VOID' AND s.created_at::date=?""",
      (rs, i) -> new BigDecimal[]{rs.getBigDecimal(1), rs.getBigDecimal(2)}, d);
  }
  public BigDecimal discounts(LocalDate d) { return sum("SELECT COALESCE(SUM(discount),0) FROM sales WHERE status<>'VOID' AND created_at::date=?", d); }
  public BigDecimal cashReceived(LocalDate d) { return sum("SELECT COALESCE(SUM(amount),0) FROM payments WHERE created_at::date=?", d); }
  public BigDecimal creditGiven(LocalDate d) { return sum("SELECT COALESCE(SUM(total-paid_amount),0) FROM sales WHERE status IN('CREDIT','PARTIAL') AND created_at::date=?", d); }
  public BigDecimal expenses(LocalDate d) { return sum("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE created_at::date=?", d); }
  public BigDecimal supplierPaid(LocalDate d) { return sum("SELECT COALESCE(SUM(paid),0) FROM purchases WHERE created_at::date=?", d); }

  public List<ExpenseLine> expenseLines(LocalDate d) {
    return db.query("SELECT category, SUM(amount) FROM expenses WHERE created_at::date=? GROUP BY category ORDER BY 2 DESC",
        (rs, i) -> new ExpenseLine(rs.getString(1), rs.getBigDecimal(2)), d);
  }
  public List<ProductSales> byProduct(LocalDate d) {
    return db.query("""
      SELECT p.name, SUM(si.qty), SUM(si.line_total), SUM(si.qty*si.unit_cost), SUM(si.line_total-si.qty*si.unit_cost)
      FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
      WHERE s.status<>'VOID' AND s.created_at::date=? GROUP BY p.name ORDER BY 5 DESC""",
      (rs, i) -> new ProductSales(rs.getString(1), rs.getBigDecimal(2), rs.getBigDecimal(3), rs.getBigDecimal(4), rs.getBigDecimal(5)), d);
  }

  // ---------- date-range report ----------
  private BigDecimal sum(String sql, LocalDate a, LocalDate b) { return db.queryForObject(sql, BigDecimal.class, a, b); }

  public BigDecimal[] grossAndCogs(LocalDate a, LocalDate b) {
    return db.queryForObject("""
      SELECT COALESCE(SUM(si.line_total),0), COALESCE(SUM(si.qty*si.unit_cost),0)
      FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.status<>'VOID' AND s.created_at::date BETWEEN ? AND ?""",
      (rs, i) -> new BigDecimal[]{rs.getBigDecimal(1), rs.getBigDecimal(2)}, a, b);
  }
  public BigDecimal discounts(LocalDate a, LocalDate b) { return sum("SELECT COALESCE(SUM(discount),0) FROM sales WHERE status<>'VOID' AND created_at::date BETWEEN ? AND ?", a, b); }
  public BigDecimal cashReceived(LocalDate a, LocalDate b) { return sum("SELECT COALESCE(SUM(amount),0) FROM payments WHERE created_at::date BETWEEN ? AND ?", a, b); }
  public BigDecimal creditGiven(LocalDate a, LocalDate b) { return sum("SELECT COALESCE(SUM(total-paid_amount),0) FROM sales WHERE status IN('CREDIT','PARTIAL') AND created_at::date BETWEEN ? AND ?", a, b); }
  public BigDecimal expenses(LocalDate a, LocalDate b) { return sum("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE created_at::date BETWEEN ? AND ?", a, b); }
  public BigDecimal supplierPaid(LocalDate a, LocalDate b) { return sum("SELECT COALESCE(SUM(paid),0) FROM purchases WHERE created_at::date BETWEEN ? AND ?", a, b); }
  public long salesCount(LocalDate a, LocalDate b) {
    Long n = db.queryForObject("SELECT COUNT(*) FROM sales WHERE status<>'VOID' AND created_at::date BETWEEN ? AND ?", Long.class, a, b);
    return n == null ? 0 : n;
  }

  /** One row per day, including days with no sales, so the chart has no gaps. */
  public List<RangeReport.DayPoint> days(LocalDate a, LocalDate b) {
    return db.query("""
      SELECT d::date,
        COALESCE((SELECT SUM(si.line_total) FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.status<>'VOID' AND s.created_at::date=d::date),0)
          - COALESCE((SELECT SUM(discount) FROM sales WHERE status<>'VOID' AND created_at::date=d::date),0),
        COALESCE((SELECT SUM(si.qty*si.unit_cost) FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.status<>'VOID' AND s.created_at::date=d::date),0),
        COALESCE((SELECT SUM(amount) FROM expenses WHERE created_at::date=d::date),0)
      FROM generate_series(?::date, ?::date, interval '1 day') d ORDER BY 1""",
      (rs, i) -> {
        BigDecimal net = rs.getBigDecimal(2), cogs = rs.getBigDecimal(3), exp = rs.getBigDecimal(4);
        return new RangeReport.DayPoint(rs.getDate(1).toLocalDate(), net, cogs, exp, net.subtract(cogs).subtract(exp));
      }, a, b);
  }

  public List<ProductSales> byProduct(LocalDate a, LocalDate b) {
    return db.query("""
      SELECT p.name, SUM(si.qty), SUM(si.line_total), SUM(si.qty*si.unit_cost), SUM(si.line_total-si.qty*si.unit_cost)
      FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
      WHERE s.status<>'VOID' AND s.created_at::date BETWEEN ? AND ? GROUP BY p.name ORDER BY 5 DESC""",
      (rs, i) -> new ProductSales(rs.getString(1), rs.getBigDecimal(2), rs.getBigDecimal(3), rs.getBigDecimal(4), rs.getBigDecimal(5)), a, b);
  }

  public List<RangeReport.CustomerSales> byCustomer(LocalDate a, LocalDate b) {
    return db.query("""
      SELECT COALESCE(c.name,'Walk-in customers'), COUNT(*), SUM(s.total), SUM(s.paid_amount), SUM(s.total-s.paid_amount)
      FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
      WHERE s.status<>'VOID' AND s.created_at::date BETWEEN ? AND ? GROUP BY c.id, c.name ORDER BY 3 DESC""",
      (rs, i) -> new RangeReport.CustomerSales(rs.getString(1), rs.getLong(2), rs.getBigDecimal(3), rs.getBigDecimal(4), rs.getBigDecimal(5)), a, b);
  }

  public List<ExpenseLine> expenseLines(LocalDate a, LocalDate b) {
    return db.query("SELECT category, SUM(amount) FROM expenses WHERE created_at::date BETWEEN ? AND ? GROUP BY category ORDER BY 2 DESC",
        (rs, i) -> new ExpenseLine(rs.getString(1), rs.getBigDecimal(2)), a, b);
  }

  public List<RangeReport.MethodTotal> byMethod(LocalDate a, LocalDate b) {
    return db.query("SELECT method, SUM(amount) FROM payments WHERE created_at::date BETWEEN ? AND ? GROUP BY method ORDER BY 2 DESC",
        (rs, i) -> new RangeReport.MethodTotal(rs.getString(1), rs.getBigDecimal(2)), a, b);
  }

  /** Who owes money right now, split by how old the unpaid sale is. */
  public List<RangeReport.DebtRow> debts() {
    return db.query("""
      SELECT c.name, c.phone,
        SUM(CASE WHEN CURRENT_DATE - s.created_at::date <= 30 THEN s.total-s.paid_amount ELSE 0 END),
        SUM(CASE WHEN CURRENT_DATE - s.created_at::date BETWEEN 31 AND 60 THEN s.total-s.paid_amount ELSE 0 END),
        SUM(CASE WHEN CURRENT_DATE - s.created_at::date > 60 THEN s.total-s.paid_amount ELSE 0 END),
        SUM(s.total-s.paid_amount)
      FROM sales s JOIN customers c ON c.id=s.customer_id
      WHERE s.status IN('CREDIT','PARTIAL') GROUP BY c.id, c.name, c.phone ORDER BY 6 DESC""",
      (rs, i) -> new RangeReport.DebtRow(rs.getString(1), rs.getString(2), rs.getBigDecimal(3), rs.getBigDecimal(4), rs.getBigDecimal(5), rs.getBigDecimal(6)));
  }
}
