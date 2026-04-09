DO $$ BEGIN
  IF current_database() = 'medease_prod' THEN
    RAISE EXCEPTION 'Refusing to seed production database';
  END IF;
END $$;

BEGIN;

-- 1. Mock Data for Audit Logs
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success, details, created_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'CREATE', 'inventory', 'fcdc0000-0000-0000-0000-000000000001', '192.168.1.10', true, '{"item": "Paracetamol 500mg", "qty": 1000}', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000001', 'UPDATE', 'settings', null, '192.168.1.10', true, '{"setting": "system_email"}', NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'LOGIN', 'auth', null, '192.168.1.11', false, '{"reason": "Invalid password"}', NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'LOGIN', 'auth', null, '192.168.1.11', true, '{}', NOW() - INTERVAL '3 days'),
  ('d0000000-0000-0000-0000-000000000001', 'VIEW', 'medical_record', 'ce000000-0000-0000-0000-000000000001', '10.0.0.5', true, '{"patient": "Sarah Fernando"}', NOW() - INTERVAL '2 days'),
  ('b0000000-0000-0000-0000-000000000001', 'DISPENSE', 'prescription', 'bcdc0000-0000-0000-0000-000000000001', '10.0.0.8', true, '{"meds": ["Amoxicillin"]}', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'DELETE', 'user', 'a0000000-0000-0000-0000-000000000099', '192.168.1.10', true, '{"email": "spam@test.com"}', NOW() - INTERVAL '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'GENERATE', 'report', null, '192.168.1.10', true, '{"type": "inventory_status"}', NOW() - INTERVAL '1 hour');

-- 3. Mock Data for Inventory Transactions (used in monthly usage report)
-- We need some existing inventory IDs to link to. We will assume some inventory records exist. 
-- However, if inventory is empty, we better insert a mock inventory item to guarantee success.
DO $$ 
DECLARE 
  inv_id UUID;
BEGIN
  -- Check if there is any inventory to act upon
  SELECT id INTO inv_id FROM inventory LIMIT 1;
  
  IF inv_id IS NULL THEN
    -- Insert a dummy item if table is completely empty
    INSERT INTO inventory (id, item_name, category, quantity, reorder_level, unit) 
    VALUES (uuid_generate_v4(), 'Test Paracetamol', 'Medicine', 500, 100, 'Tablets') RETURNING id INTO inv_id;
  END IF;

  -- Add some IN and OUT transactions for reporting data
  INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, reference, created_at)
  VALUES
    (inv_id, 'IN', 1000, 'Initial restock', NOW() - INTERVAL '40 days'),
    (inv_id, 'OUT', 50, 'Dispensary request', NOW() - INTERVAL '35 days'),
    (inv_id, 'OUT', 120, 'Ward request', NOW() - INTERVAL '25 days'),
    (inv_id, 'OUT', 80, 'Dispensary request', NOW() - INTERVAL '15 days'),
    (inv_id, 'IN', 200, 'Emergency restock', NOW() - INTERVAL '10 days'),
    (inv_id, 'OUT', 40, 'Ward request', NOW() - INTERVAL '5 days'),
    (inv_id, 'OUT', 10, 'Outpatient dispense', NOW() - INTERVAL '1 day');
END $$;

COMMIT;
