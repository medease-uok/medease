-- Purchase Orders table for automated inventory ordering
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED')),
  total_amount NUMERIC(10, 2) DEFAULT 0.00,
  expected_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger for auto-updating updated_at
CREATE TRIGGER set_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_inventory_updated_at();

-- Purchase Order Items table
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2),
  total_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO medease_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_items TO medease_app;

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Allow application users appropriate access
CREATE POLICY "Allow all for authenticated app users on POs" ON purchase_orders FOR ALL TO medease_app USING (true);
CREATE POLICY "Allow all for authenticated app users on PO items" ON purchase_order_items FOR ALL TO medease_app USING (true);
