package com.shop.sales.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

/** An egg type. Stock and cost are kept per single egg; trays are a selling/buying pack. */
@Entity @Table(name = "products") @Getter @Setter
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String name;
  private String unit = "piece";                // what one single item is called: egg, bottle, kg ...
  private String packName = "pack";                // what a pack is called: tray, carton, box, sack ...
  private BigDecimal sellingPrice;                 // per single egg
  private BigDecimal trayPrice;                    // per tray (nullable)
  private int piecesPerTray = 30;
  private BigDecimal avgCost = BigDecimal.ZERO;    // weighted average cost per egg
  private BigDecimal stockQty = BigDecimal.ZERO;   // in eggs
  private boolean active = true;
}
