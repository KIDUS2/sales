-- the app now sells any product, not only eggs: each product names its own unit and pack
ALTER TABLE products ADD COLUMN pack_name TEXT NOT NULL DEFAULT 'tray';
UPDATE products SET unit='egg' WHERE unit IS NULL OR unit IN ('pcs','egg');
