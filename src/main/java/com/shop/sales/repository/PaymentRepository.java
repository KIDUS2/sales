package com.shop.sales.repository;
import com.shop.sales.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PaymentRepository extends JpaRepository<Payment, Long> { boolean existsByClientId(String clientId); }
