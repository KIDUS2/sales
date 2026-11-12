package com.shop.sales.repository;
import com.shop.sales.model.Product;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findByActiveTrueOrderByName();
  /** Row lock, so two phones selling the same eggs cannot both read the old stock. */
  @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Product p where p.id = :id")
  Optional<Product> lockById(@Param("id") Long id);
}
