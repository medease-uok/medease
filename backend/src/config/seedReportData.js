const { query } = require('./database');

async function seedReportData() {
  try {
    console.log('PostgreSQL: Starting additional report data seeding...');

    // 1. Get Inventory and Supplier data
    const inventoryResult = await query('SELECT id, item_name, unit FROM inventory LIMIT 10');
    const supplierResult = await query('SELECT name FROM suppliers LIMIT 5');
    const adminUserResult = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    if (inventoryResult.rows.length === 0 || supplierResult.rows.length === 0 || adminUserResult.rows.length === 0) {
      console.warn('Seeding Warning: Missing inventory, suppliers, or admin user. Please add some first.');
      return;
    }

    const inventory = inventoryResult.rows;
    const suppliers = supplierResult.rows;
    const adminId = adminUserResult.rows[0].id;

    // 2. Generate Inventory Transactions (Monthly Usage)
    console.log('Generating 45 inventory transactions...');
    for (let i = 0; i < 45; i++) {
        const item = inventory[Math.floor(Math.random() * inventory.length)];
        const qty = Math.floor(Math.random() * 20) + 1;
        // Random date within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        await query(
            `INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, reference, created_at) 
             VALUES ($1, 'OUT', $2, $3, $4)`,
            [item.id, qty, `DASH-REF-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, date]
        );
    }

    // 3. Generate Purchase Orders (Supplier Orders)
    console.log('Generating 15 purchase orders...');
    const statuses = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];
    for (let i = 0; i < 15; i++) {
        const item = inventory[Math.floor(Math.random() * inventory.length)];
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const qty = Math.floor(Math.random() * 100) + 50;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        await query(
            `INSERT INTO purchase_orders (inventory_id, supplier_name, quantity, status, order_date, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [item.id, supplier.name, qty, status, date, adminId]
        );
    }

    console.log('PostgreSQL: Sample report data successfully seeded!');
  } catch (err) {
    console.error('PostgreSQL Error: Failed to seed report data -', err.message);
  }
}

seedReportData().then(() => process.exit(0)).catch(() => process.exit(1));
