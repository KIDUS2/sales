package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "sales") @Getter @Setter
public class Sale {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String clientId;                 // id made on the device, makes re-sending safe
  private Long customerId;
  private Instant createdAt = Instant.now();
  private BigDecimal discount = BigDecimal.ZERO;
  private BigDecimal total;
  private BigDecimal paidAmount = BigDecimal.ZERO;
  @Enumerated(EnumType.STRING) private SaleStatus status = SaleStatus.CREDIT;
  private String voidReason;
  private Long dispatchId;               // the load this sale came from (null = sold from the warehouse)
  private Long soldBy;
  @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL) private List<SaleItem> items = new ArrayList<>();

  public void addItem(SaleItem i) { i.setSale(this); items.add(i); }
  public BigDecimal owing() { return total.subtract(paidAmount); }
}
