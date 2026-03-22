-- Inventory table: tracking hospital inventory including equipment, supplies, etc.
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Surgical', 'Stationery', 'Medical Equipment', 'Consumables'
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50), -- e.g., 'boxes', 'bottles', 'pieces', 'packs'
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inventory_item_name ON inventory(item_name);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);

-- Full-text search index for inventory
CREATE INDEX idx_inventory_search ON inventory USING GIN (
  to_tsvector('english', item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(supplier, ''))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory TO medease_app;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Allow application users appropriate access (RLS policy)
CREATE POLICY "Allow all for authenticated app users" ON inventory FOR ALL TO medease_app USING (true);
