-- login tokens (only a hash of the token is stored)
CREATE TABLE auth_tokens(
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL);
CREATE INDEX ON auth_tokens(user_id);

-- stock issued to a salesperson ("load"), and what happened to it
CREATE TABLE dispatches(
  id BIGSERIAL PRIMARY KEY,
  salesperson_id BIGINT NOT NULL REFERENCES users(id),
  issued_by BIGINT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'OPEN',
  note TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by BIGINT REFERENCES users(id),
  cash_counted NUMERIC(12,2));
CREATE INDEX ON dispatches(salesperson_id, status);
CREATE TABLE dispatch_items(
  id BIGSERIAL PRIMARY KEY,
  dispatch_id BIGINT NOT NULL REFERENCES dispatches(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  issued_qty NUMERIC(12,2) NOT NULL,
  returned_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  broken_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE(dispatch_id, product_id));

-- who did it, and which load it belongs to
ALTER TABLE sales ADD COLUMN dispatch_id BIGINT REFERENCES dispatches(id), ADD COLUMN sold_by BIGINT REFERENCES users(id);
ALTER TABLE payments ADD COLUMN dispatch_id BIGINT REFERENCES dispatches(id), ADD COLUMN received_by BIGINT REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN dispatch_id BIGINT REFERENCES dispatches(id), ADD COLUMN created_by BIGINT REFERENCES users(id);
CREATE INDEX ON sales(dispatch_id); CREATE INDEX ON payments(dispatch_id); CREATE INDEX ON expenses(dispatch_id);
