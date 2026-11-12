package com.shop.sales.repository;

import com.shop.sales.dto.DispatchView;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Plain SQL for loads: the totals are sums over sales/payments/expenses, so they can never drift from the real records. */
@Repository @RequiredArgsConstructor
public class DispatchRepository {
    public static final String BROKEN = "Broken eggs", MISSING = "Missing eggs";
    private final JdbcTemplate db;

    public Optional<Long> openIdFor(Long salespersonId) {
        return db.queryForList("SELECT id FROM dispatches WHERE salesperson_id=? AND status='OPEN' ORDER BY id DESC LIMIT 1", Long.class, salespersonId).stream().findFirst();
    }

    /** Locks the load row, so two phones cannot both sell the last eggs. Returns the status. */
    public Optional<String> lock(Long id) {
        return db.queryForList("SELECT status FROM dispatches WHERE id=? FOR UPDATE", String.class, id).stream().findFirst();
    }

    public Long create(Long salespersonId, Long issuedBy, String note) {
        return db.queryForObject("INSERT INTO dispatches(salesperson_id, issued_by, note) VALUES (?,?,?) RETURNING id", Long.class, salespersonId, issuedBy, note);
    }

    public void addIssued(Long dispatchId, Long productId, BigDecimal eggs) {
        db.update("INSERT INTO dispatch_items(dispatch_id, product_id, issued_qty) VALUES (?,?,?) "
                + "ON CONFLICT (dispatch_id, product_id) DO UPDATE SET issued_qty = dispatch_items.issued_qty + EXCLUDED.issued_qty", dispatchId, productId, eggs);
    }

    public void setClosingQty(Long dispatchId, Long productId, BigDecimal returned, BigDecimal broken) {
        db.update("UPDATE dispatch_items SET returned_qty=?, broken_qty=? WHERE dispatch_id=? AND product_id=?", returned, broken, dispatchId, productId);
    }

    public void close(Long id, Long closedBy, BigDecimal cashCounted, String note) {
        db.update("UPDATE dispatches SET status='CLOSED', closed_at=now(), closed_by=?, cash_counted=?, note=COALESCE(?, note) WHERE id=?", closedBy, cashCounted, note, id);
    }

    public BigDecimal sold(Long dispatchId, Long productId) {
        return db.queryForObject("SELECT COALESCE(SUM(si.qty),0) FROM sale_items si JOIN sales s ON s.id=si.sale_id "
                + "WHERE s.dispatch_id=? AND si.product_id=? AND s.status<>'VOID'", BigDecimal.class, dispatchId, productId);
    }

    /** issued - sold - returned - broken for one egg type. */
    public BigDecimal remaining(Long dispatchId, Long productId) {
        return db.queryForObject("SELECT COALESCE((SELECT issued_qty - returned_qty - broken_qty FROM dispatch_items WHERE dispatch_id=? AND product_id=?),0) "
                + "- (SELECT COALESCE(SUM(si.qty),0) FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.dispatch_id=? AND si.product_id=? AND s.status<>'VOID')",
                BigDecimal.class, dispatchId, productId, dispatchId, productId);
    }

    public Optional<DispatchView> find(Long id) { return list("WHERE d.id=?", id).stream().findFirst(); }
    public List<DispatchView> all(int limit) { return list("WHERE true ORDER BY d.id DESC LIMIT " + Math.max(1, Math.min(limit, 500))); }
    public List<DispatchView> forSalesperson(Long userId, int limit) { return list("WHERE d.salesperson_id=? ORDER BY d.id DESC LIMIT " + Math.max(1, Math.min(limit, 200)), userId); }

    private List<DispatchView> list(String where, Object... args) {
        return db.query("SELECT d.id, d.salesperson_id, u.full_name, d.status, d.note, d.opened_at, d.closed_at, d.cash_counted "
                + "FROM dispatches d JOIN users u ON u.id=d.salesperson_id " + where, (rs, n) -> head(rs), args)
                .stream().map(h -> h.withDetails(items(h.id()), totals(h.id()))).toList();
    }

    private record Head(Long id, Long sp, String name, String status, String note, java.time.Instant opened, java.time.Instant closed, BigDecimal counted) {
        DispatchView withDetails(List<DispatchView.Item> items, DispatchView.Totals totals) {
            return new DispatchView(id, sp, name, status, note, opened, closed, counted, items, totals);
        }
    }

    private Head head(ResultSet rs) throws SQLException {
        var o = rs.getTimestamp("opened_at"); var c = rs.getTimestamp("closed_at");
        return new Head(rs.getLong("id"), rs.getLong("salesperson_id"), rs.getString("full_name"), rs.getString("status"), rs.getString("note"),
                o == null ? null : o.toInstant(), c == null ? null : c.toInstant(), rs.getBigDecimal("cash_counted"));
    }

    private List<DispatchView.Item> items(Long id) {
        return db.query("SELECT i.product_id, p.name, p.pieces_per_tray, i.issued_qty, i.returned_qty, i.broken_qty, "
                + "COALESCE((SELECT SUM(si.qty) FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.dispatch_id=i.dispatch_id AND si.product_id=i.product_id AND s.status<>'VOID'),0) AS sold "
                + "FROM dispatch_items i JOIN products p ON p.id=i.product_id WHERE i.dispatch_id=? ORDER BY p.name", (rs, n) -> {
            BigDecimal issued = rs.getBigDecimal("issued_qty"), sold = rs.getBigDecimal("sold"), ret = rs.getBigDecimal("returned_qty"), br = rs.getBigDecimal("broken_qty");
            return new DispatchView.Item(rs.getLong("product_id"), rs.getString("name"), rs.getInt("pieces_per_tray"), issued, sold, ret, br, issued.subtract(sold).subtract(ret).subtract(br));
        }, id);
    }

    private DispatchView.Totals totals(Long id) {
        BigDecimal sales = db.queryForObject("SELECT COALESCE(SUM(total),0) FROM sales WHERE dispatch_id=? AND status<>'VOID'", BigDecimal.class, id);
        BigDecimal paidOnSales = db.queryForObject("SELECT COALESCE(SUM(paid_amount),0) FROM sales WHERE dispatch_id=? AND status<>'VOID'", BigDecimal.class, id);
        BigDecimal cash = db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM payments WHERE dispatch_id=? AND method='CASH'", BigDecimal.class, id);
        BigDecimal other = db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM payments WHERE dispatch_id=? AND method<>'CASH'", BigDecimal.class, id);
        BigDecimal trip = db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE dispatch_id=? AND category NOT IN (?,?)", BigDecimal.class, id, BROKEN, MISSING);
        BigDecimal loss = db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE dispatch_id=? AND category IN (?,?)", BigDecimal.class, id, BROKEN, MISSING);
        return new DispatchView.Totals(sales, sales.subtract(paidOnSales), cash, other, trip, cash.subtract(trip), loss);
    }
}
