package com.shop.sales.repository;

import com.shop.sales.dto.TransactionRow;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** One time-ordered list of everything that happened: sales, payments, expenses, purchases and stock issued/returned. */
@Repository @RequiredArgsConstructor
public class TransactionRepository {
    private final JdbcTemplate db;

    public List<TransactionRow> find(LocalDate from, LocalDate to, String kind, Long userId, int limit) {
        String tz = "Africa/Addis_Ababa";
        String sql = """
            SELECT * FROM (
              SELECT 'SALE' kind, s.id, s.created_at AS ts, s.total amount, COALESCE(c.name,'Walk-in') title,
                     s.status || CASE WHEN s.dispatch_id IS NOT NULL THEN ' · load #' || s.dispatch_id ELSE '' END detail,
                     NULL::text AS method, s.sold_by AS uid, s.dispatch_id AS did
                FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
              UNION ALL
              SELECT 'PAYMENT', p.id, p.created_at, p.amount, COALESCE(c.name,'Customer'),
                     CASE WHEN p.sale_id IS NULL THEN 'Payment on account' ELSE 'Paid at sale' END, p.method, p.received_by, p.dispatch_id
                FROM payments p LEFT JOIN customers c ON c.id=p.customer_id
              UNION ALL
              SELECT 'EXPENSE', e.id, e.created_at, e.amount, e.category, e.note, NULL, e.created_by, e.dispatch_id FROM expenses e
              UNION ALL
              SELECT 'PURCHASE', pu.id, pu.created_at, pu.total, 'Bought ' || pr.name, COALESCE(pu.supplier,''), NULL, NULL, NULL
                FROM purchases pu JOIN products pr ON pr.id=pu.product_id
              UNION ALL
              SELECT 'ISSUE', d.id, d.opened_at, (SELECT COALESCE(SUM(issued_qty),0) FROM dispatch_items WHERE dispatch_id=d.id),
                     'Stock given to ' || u.full_name, 'Load #' || d.id, NULL, d.issued_by, d.id
                FROM dispatches d JOIN users u ON u.id=d.salesperson_id
              UNION ALL
              SELECT 'RETURN', d.id, d.closed_at, (SELECT COALESCE(SUM(returned_qty),0) FROM dispatch_items WHERE dispatch_id=d.id),
                     'Stock returned by ' || u.full_name, 'Load #' || d.id, NULL, d.closed_by, d.id
                FROM dispatches d JOIN users u ON u.id=d.salesperson_id WHERE d.closed_at IS NOT NULL
            ) t
            LEFT JOIN (SELECT id uid2, full_name uname FROM users) us ON us.uid2 = t.uid
            WHERE (t.ts AT TIME ZONE ?)::date BETWEEN ? AND ?
            """;
        List<Object> args = new ArrayList<>(List.of(tz, java.sql.Date.valueOf(from), java.sql.Date.valueOf(to)));
        if (kind != null && !kind.isBlank()) { sql += " AND t.kind = ?"; args.add(kind.toUpperCase()); }
        if (userId != null) { sql += " AND t.uid = ?"; args.add(userId); }
        sql += " ORDER BY t.ts DESC LIMIT " + Math.max(1, Math.min(limit, 1000));
        return db.query(sql, (rs, n) -> new TransactionRow(rs.getString("kind"), rs.getLong("id"), rs.getTimestamp("ts").toInstant(),
                rs.getBigDecimal("amount"), rs.getString("title"), rs.getString("detail"), rs.getString("method"),
                (Long) rs.getObject("uid"), rs.getString("uname"), (Long) rs.getObject("did")), args.toArray());
    }
}
