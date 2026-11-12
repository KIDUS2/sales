package com.shop.sales.repository;
import com.shop.sales.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PurchaseRepository extends JpaRepository<Purchase, Long> { boolean existsByClientId(String clientId); }
