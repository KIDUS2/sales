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
}
