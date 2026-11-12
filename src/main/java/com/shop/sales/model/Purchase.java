package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "purchases") @Getter @Setter
public class Purchase {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String clientId;
  private Long productId;
  private String supplier;
  private BigDecimal trays;
  private BigDecimal pieces;
  private BigDecimal costPerTray;
  private BigDecimal total;
  private BigDecimal paid;
  private Instant createdAt = Instant.now();
}
