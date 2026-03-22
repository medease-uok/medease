-- Inventory table: tracking hospital inventory including equipment, supplies, etc.
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Surgical', 'Stationery', 'Medical Equipment', 'Consumables'
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50), -- e.g., 'boxes', 'bottles', 'pieces', 'packs'
  reorder_level INTEGER DEFAULT 10,
  expiry_date DATE,
  supplier VARCHAR(255),
  location VARCHAR(100),
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_item_name ON inventory(item_name);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);

-- Full-text search index for inventory
CREATE INDEX idx_inventory_search ON inventory USING GIN (
  to_tsvector('english', item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(supplier, ''))
);

GRANT ALL ON inventory TO medease_app;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Seed Data for Inventory
INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location) VALUES
  ('Surgical Masks (N95)', 'Consumables', 500, 'boxes', 50, '2028-12-31', 'MediSupply Co.', 'Main Store Room A'),
  ('Latex Examination Gloves (Medium)', 'Consumables', 1200, 'boxes', 200, '2027-06-30', 'SafeHand Ltd.', 'Main Store Room A'),
  ('Syringes (5ml) with Needles', 'Surgical', 3000, 'pieces', 500, '2029-01-15', 'Injecta Systems', 'Ward Supply Closet B'),
  ('Sterile Gauze Swabs (10x10cm)', 'Surgical', 850, 'packs', 100, '2028-05-20', 'WoundCare Inc.', 'Surgical Prep Room'),
  ('Digital Thermometers', 'Medical Equipment', 45, 'pieces', 10, NULL, 'TechMed', 'Nurse Station 1'),
  ('Sphygmomanometer (Manual)', 'Medical Equipment', 25, 'pieces', 5, NULL, 'TechMed', 'Nurse Station 2'),
  ('Hand Sanitizer Refills (1L)', 'Consumables', 120, 'bottles', 30, '2026-11-30', 'CleanLife', 'Janitorial Supply'),
  ('Printer Paper (A4)', 'Stationery', 40, 'boxes', 10, NULL, 'Office Plus', 'Admin Office'),
  ('Defibrillator Pads', 'Surgical', 15, 'packs', 5, '2027-03-10', 'LifeSave Devices', 'Emergency Trolley'),
  ('IV Fluids (Normal Saline 500ml)', 'Consumables', 450, 'bottles', 100, '2026-08-15', 'PharmaDrop', 'Main Store Room B');
