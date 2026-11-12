package com.shop.sales.repository;
import com.shop.sales.dto.CustomerRow;
import com.shop.sales.model.Customer;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface CustomerRepository extends JpaRepository<Customer, Long> {
  @Query(nativeQuery = true, value = """
    SELECT c.id AS "id", c.name AS "name", c.phone AS "phone", c.type AS "type", c.credit_limit AS "creditLimit",
      COALESCE((SELECT SUM(total) FROM sales WHERE customer_id=c.id AND status<>'VOID'),0)
      - COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id=c.id),0) AS "balance",
      (SELECT to_char(MIN(created_at),'YYYY-MM-DD') FROM sales WHERE customer_id=c.id AND status IN('CREDIT','PARTIAL')) AS "oldestDebt"
    FROM customers c ORDER BY c.name""")
  List<CustomerRow> findAllWithBalance();

  @Query(nativeQuery = true, value = """
    SELECT COALESCE((SELECT SUM(total) FROM sales WHERE customer_id=:id AND status<>'VOID'),0)
         - COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id=:id),0)""")
  BigDecimal balanceOf(@Param("id") Long id);
}
