package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "sale_items") @Getter @Setter
public class SaleItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sale_id") private Sale sale;
  private Long productId;
  private BigDecimal qty;          // always in single eggs
  private BigDecimal unitPrice;    // per egg
  private BigDecimal unitCost;     // cost per egg at the time of sale
  @Enumerated(EnumType.STRING) private SaleUnit packUnit;
  private BigDecimal packQty;      // as sold: trays or eggs
  private BigDecimal lineTotal;
}
