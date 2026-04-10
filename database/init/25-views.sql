-- 1. DROP EXISTING VIEWS (To avoid column name conflicts on replace)
DROP VIEW IF EXISTS vw_supplier_order_summary;
DROP VIEW IF EXISTS vw_appointment_summary;
DROP VIEW IF EXISTS vw_monthly_inventory_usage;
DROP VIEW IF EXISTS vw_inventory_status;

-- 1. vw_inventory_status
CREATE OR REPLACE VIEW vw_inventory_status AS

SELECT 
    id,
    item_name,
    category,
    quantity,
    reorder_level,
    unit,
    CASE 
        WHEN quantity = 0 THEN 'Out of Stock'
        WHEN quantity <= reorder_level THEN 'Reorder Recommended'
        ELSE 'Healthy'
    END AS stock_status,
    expiry_date,
    CASE 
        WHEN expiry_date IS NULL THEN 'Unknown'
        WHEN expiry_date < CURRENT_DATE THEN 'Expired'
        WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Valid'
    END AS expiry_status
FROM inventory
WHERE deleted_at IS NULL;

-- 2. vw_monthly_inventory_usage
CREATE OR REPLACE VIEW vw_monthly_inventory_usage AS
SELECT 
    i.id AS inventory_id,
    i.item_name,
    i.category,
    DATE_TRUNC('month', it.created_at) AS usage_month,
    SUM(it.quantity_changed) AS total_quantity_used
FROM inventory_transactions it
JOIN inventory i ON it.inventory_id = i.id
WHERE it.transaction_type = 'OUT' AND i.deleted_at IS NULL
GROUP BY i.id, i.item_name, i.category, DATE_TRUNC('month', it.created_at);

-- 3. vw_appointment_summary
CREATE OR REPLACE VIEW vw_appointment_summary AS
SELECT 
    a.id AS appointment_id,
    a.scheduled_at,
    a.status,
    p.id AS patient_id,
    COALESCE(pu.first_name || ' ' || pu.last_name, 'Unknown') AS patient_name,
    d.id AS doctor_id,
    COALESCE(du.first_name || ' ' || du.last_name, 'Unknown') AS doctor_name,
    d.specialization AS specialty,
    DATE_TRUNC('day', a.scheduled_at) AS appointment_day
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN users pu ON p.user_id = pu.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN users du ON d.user_id = du.id;

-- 4. vw_supplier_order_summary
CREATE OR REPLACE VIEW vw_supplier_order_summary AS
SELECT 
    s.id AS supplier_id,
    s.name AS supplier_name,
    COUNT(p.id) AS total_orders,
    SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
    SUM(CASE WHEN p.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_orders,
    SUM(CASE WHEN p.status = 'ORDERED' THEN 1 ELSE 0 END) AS ordered_orders,
    SUM(CASE WHEN p.status = 'RECEIVED' THEN 1 ELSE 0 END) AS received_orders,
    SUM(CASE WHEN p.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
    MAX(p.order_date) AS last_order_date
FROM suppliers s
LEFT JOIN purchase_orders p ON s.id = p.supplier_id
GROUP BY s.id, s.name;


-- Standardize permissions for views are handled separately in init scripts
-- to avoid runtime permission errors when executed by the application user.


