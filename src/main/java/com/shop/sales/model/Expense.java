package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "expenses") @Getter @Setter
public class Expense {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String clientId;
  private String category;
  private BigDecimal amount;
  private String note;
  private Instant createdAt = Instant.now();
}
