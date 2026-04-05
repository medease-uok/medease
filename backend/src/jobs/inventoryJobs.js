const db = require('../config/database');
const cron = require('node-cron');

const checkLowStockAndOrder = async () => {
  try {
    console.log('[Inventory] Running job: Checking low stock items to generate purchase orders');
    
    // Find inventory items below reorder level, that don't have a PENDING or ORDERED purchase order
    const query = `
      SELECT id, item_name, quantity, reorder_level, supplier
      FROM inventory
      WHERE quantity <= reorder_level
        AND deleted_at IS NULL
        AND id NOT IN (
          SELECT inventory_id 
          FROM purchase_orders 
          WHERE status IN ('PENDING', 'APPROVED', 'ORDERED')
        )
    `;
    
    const result = await db.query(query);
    const items = result.rows;
    
    if (items.length === 0) {
      console.log('[Inventory] No new purchase orders need to be generated.');
      return;
    }
    
    for (const item of items) {
      // Create a purchase order to restock up to double the reorder level, minimum 10.
      const orderQuantity = Math.max(item.reorder_level * 2 - item.quantity, 10);
      
      const insertQuery = `
        INSERT INTO purchase_orders (inventory_id, supplier_name, quantity, status)
        VALUES ($1, $2, $3, 'PENDING')
        RETURNING id;
      `;
      
      await db.query(insertQuery, [item.id, item.supplier, orderQuantity]);
      console.log(\`[Inventory] Auto-generated purchase order for \${item.item_name} (Qty: \${orderQuantity})\`);
    }
    
  } catch (error) {
    console.error('[Inventory] Error generating automated purchase orders:', error.message);
  }
};

const startInventoryScheduler = () => {
  // schedule to run daily at 2:00 AM (server time)
  cron.schedule('0 2 * * *', async () => {
    try {
      await checkLowStockAndOrder();
    } catch (err) {
      console.error('[Inventory] Unhandled error in inventory job:', err.message);
    }
  });
  console.log('[Inventory] Automated purchase order scheduler started (runs daily at 2:00 AM)');
};

module.exports = {
  checkLowStockAndOrder,
  startInventoryScheduler
};
