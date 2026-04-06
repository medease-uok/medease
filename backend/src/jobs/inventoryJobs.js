const db = require('../config/database');
const cron = require('node-cron');

const ORDER_MULTIPLIER = process.env.PO_REORDER_MULTIPLIER || 2;
const MIN_ORDER_QTY = process.env.PO_MIN_ORDER_QTY || 10;

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
    
    let generatedCount = 0;

    for (const item of items) {
      // Calculate order quantity based on configurable multiplier
      let targetStock = item.reorder_level > 0 ? item.reorder_level * ORDER_MULTIPLIER : MIN_ORDER_QTY * 2;
      const orderQuantity = Math.max(targetStock - item.quantity, MIN_ORDER_QTY);
      
      const insertQuery = `
        INSERT INTO purchase_orders (inventory_id, supplier_name, quantity, status)
        VALUES ($1, $2, $3, 'PENDING')
        RETURNING id;
      `;
      
      await db.query(insertQuery, [item.id, item.supplier, orderQuantity]);
      console.log(`[Inventory] Auto-generated purchase order for ${item.item_name} (Qty: ${orderQuantity})`);
      generatedCount++;
    }
    
    console.log(`[Inventory] Job complete. Generated ${generatedCount} purchase orders at ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('[Inventory] Error generating automated purchase orders:', error.stack || error.message);
  }
};

const startInventoryScheduler = () => {
  // schedule to run daily at 2:00 AM (server time)
  cron.schedule('0 2 * * *', async () => {
    try {
      await checkLowStockAndOrder();
    } catch (err) {
      console.error('[Inventory] Unhandled error in inventory job:', err.stack || err.message);
    }
  });
  console.log('[Inventory] Automated purchase order scheduler started (runs daily at 2:00 AM)');
};

module.exports = {
  checkLowStockAndOrder,
  startInventoryScheduler
};
