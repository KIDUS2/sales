package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "payments") @Getter @Setter
public class Payment {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String clientId;
  private Long customerId;
  private Long saleId;
  private BigDecimal amount;
  @Enumerated(EnumType.STRING) private PaymentMethod method = PaymentMethod.CASH;
  private Instant createdAt = Instant.now();
}
