ALTER TABLE products ADD COLUMN pieces_per_tray INT NOT NULL DEFAULT 30, ADD COLUMN tray_price NUMERIC(12,2);
ALTER TABLE products ALTER COLUMN avg_cost TYPE NUMERIC(12,4);
ALTER TABLE sale_items ALTER COLUMN unit_cost TYPE NUMERIC(12,4), ALTER COLUMN unit_price TYPE NUMERIC(12,4),
  ADD COLUMN pack_unit TEXT NOT NULL DEFAULT 'PIECE', ADD COLUMN pack_qty NUMERIC(12,2), ADD COLUMN line_total NUMERIC(12,2);
UPDATE sale_items SET pack_qty=qty, line_total=qty*unit_price;
ALTER TABLE customers ADD COLUMN type TEXT DEFAULT 'SHOP';
CREATE TABLE purchases(
  id BIGSERIAL PRIMARY KEY, client_id TEXT UNIQUE NOT NULL, product_id BIGINT NOT NULL REFERENCES products(id),
  supplier TEXT, trays NUMERIC(12,2) NOT NULL, pieces NUMERIC(12,2) NOT NULL, cost_per_tray NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL, paid NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX ON purchases(created_at);
