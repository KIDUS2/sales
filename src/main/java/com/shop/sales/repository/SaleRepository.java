package com.shop.sales.repository;
import com.shop.sales.model.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface SaleRepository extends JpaRepository<Sale, Long> {
  Optional<Sale> findByClientId(String clientId);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select s from Sale s where s.customerId = :cid and s.status in :st order by s.createdAt")
  List<Sale> findOpenForUpdate(@Param("cid") Long customerId, @Param("st") Collection<SaleStatus> statuses);
}
