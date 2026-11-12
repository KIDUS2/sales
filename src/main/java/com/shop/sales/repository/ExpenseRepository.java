package com.shop.sales.repository;
import com.shop.sales.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ExpenseRepository extends JpaRepository<Expense, Long> { boolean existsByClientId(String clientId); }
