-- Inventory table: tracking hospital inventory including equipment, supplies, etc.
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Surgical', 'Stationery', 'Medical Equipment', 'Consumables'
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50) NOT NULL, -- e.g., 'boxes', 'bottles', 'pieces', 'packs'
  reorder_level INTEGER DEFAULT 10 CHECK (reorder_level >= 0),
  expiry_date DATE,
  supplier VARCHAR(255),
  location VARCHAR(100),
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_inventory_updated_at();

CREATE INDEX idx_inventory_item_name ON inventory(item_name);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);

-- Full-text search index for inventory (partial index excluding deleted)
CREATE INDEX idx_inventory_search ON inventory USING GIN (
  to_tsvector('english', item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(supplier, ''))
) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory TO medease_app;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Inventory table: tracking hospital inventory including equipment, supplies, etc.
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Surgical', 'Stationery', 'Medical Equipment', 'Consumables'
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50) NOT NULL, -- e.g., 'boxes', 'bottles', 'pieces', 'packs'
  reorder_level INTEGER DEFAULT 10 CHECK (reorder_level >= 0),
  expiry_date DATE,
  supplier VARCHAR(255),
  location VARCHAR(100),
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_inventory_updated_at();

CREATE INDEX idx_inventory_item_name ON inventory(item_name);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);

-- Full-text search index for inventory (partial index excluding deleted)
CREATE INDEX idx_inventory_search ON inventory USING GIN (
  to_tsvector('english', item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(supplier, ''))
) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory TO medease_app;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Allow application users appropriate access (RLS policy)
CREATE POLICY "Allow all for authenticated app users" ON inventory FOR ALL TO medease_app USING (true);

-- Inventory Transactions table: tracking stock usage and trends
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE RESTRICT,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT')), -- 'IN', 'OUT', 'ADJUSTMENT'
  quantity_changed INTEGER NOT NULL,
  reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to auto-log changes in inventory quantity
CREATE OR REPLACE FUNCTION log_inventory_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, reference)
    VALUES (NEW.id, 'IN', NEW.quantity, 'Initial Stock');
  ELSIF TG_OP = 'UPDATE' AND NEW.quantity <> OLD.quantity AND NEW.deleted_at IS NULL THEN
    INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, reference)
    VALUES (
      NEW.id,
      CASE WHEN NEW.quantity > OLD.quantity THEN 'IN' ELSE 'OUT' END,
      ABS(NEW.quantity - OLD.quantity),
      'Stock Update'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_transaction
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION log_inventory_transaction();

CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);

GRANT SELECT, INSERT ON inventory_transactions TO medease_app;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for app users" ON inventory_transactions FOR SELECT TO medease_app USING (true);
CREATE POLICY "Allow insert for app users" ON inventory_transactions FOR INSERT TO medease_app WITH CHECK (true);
