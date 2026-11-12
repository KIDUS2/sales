package com.shop.sales.service;
import static com.shop.sales.util.Money.*;
import com.shop.sales.dto.*;
import com.shop.sales.exception.ApiException;
import com.shop.sales.model.*;
import com.shop.sales.repository.*;
import java.math.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class PurchaseService {
  private final PurchaseRepository purchases;
  private final ProductRepository products;

  /** Eggs bought from a farm or supplier. Stock goes up and the cost per egg becomes the weighted average. */
  @Transactional
  public PurchaseResponse receive(PurchaseRequest r) {
    if (purchases.existsByClientId(r.clientId())) return new PurchaseResponse(null, true);
    Product p = products.lockById(r.productId()).orElseThrow(() -> ApiException.notFound("Product not found"));

    BigDecimal pieces = r.trays().multiply(BigDecimal.valueOf(p.getPiecesPerTray()));
    BigDecimal total = round(r.trays().multiply(r.costPerTray()));
    BigDecimal base = p.getStockQty().max(BigDecimal.ZERO);
    BigDecimal avg = base.multiply(p.getAvgCost()).add(total).divide(base.add(pieces), 4, RoundingMode.HALF_UP);

    Purchase pu = new Purchase();
    pu.setClientId(r.clientId());
    pu.setProductId(p.getId());
    pu.setSupplier(r.supplier());
    pu.setTrays(r.trays());
    pu.setPieces(pieces);
    pu.setCostPerTray(r.costPerTray());
    pu.setTotal(total);
    pu.setPaid(r.paid() == null ? total : r.paid());
    purchases.save(pu);

    p.setStockQty(p.getStockQty().add(pieces));
    p.setAvgCost(avg);
    return new PurchaseResponse(avg, false);
  }
}
