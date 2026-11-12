package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "customers") @Getter @Setter
public class Customer {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String name;
  private String phone;
  @Enumerated(EnumType.STRING) private CustomerType type = CustomerType.SHOP;
  private BigDecimal creditLimit = BigDecimal.ZERO;
}
