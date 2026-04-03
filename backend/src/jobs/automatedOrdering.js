const cron = require('node-cron');
const pool = require('../config/database');
const { createNotification } = require('../utils/notifications.util');
const logger = require('../utils/logger.util'); // Assumes a logger exists, adjust if console is preferred

/**
 * Automates the ordering process for low stock inventory items.
 * Finds items below their reorder level and creates pending purchase orders.
 */
const processAutomatedOrdering = async () => {
  logger.info('Starting automated ordering job for low stock items');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Find all inventory items that need reordering
    // Only select items that don't already have a pending purchase order
    const lowStockQuery = `
      SELECT 
        i.id AS inventory_id,
        i.item_name,
        i.quantity,
        i.reorder_level,
        s.id AS supplier_id,
        s.name AS supplier_name
      FROM inventory i
      JOIN suppliers s ON i.supplier = s.name -- matching by name as per current schema, ideally should be supplier_id
      WHERE i.quantity <= i.reorder_level
        AND i.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM purchase_order_items poi
          JOIN purchase_orders po ON poi.purchase_order_id = po.id
          WHERE poi.inventory_id = i.id 
            AND po.status IN ('PENDING', 'ORDERED', 'APPROVED')
        )
    `;
    
    const { rows: lowStockItems } = await client.query(lowStockQuery);

    if (lowStockItems.length === 0) {
      logger.info('No low stock items require ordering at this time.');
      await client.query('COMMIT');
      return;
    }

    // Group items by supplier to create one PO per supplier
    const itemsBySupplier = lowStockItems.reduce((acc, item) => {
      if (!acc[item.supplier_id]) {
        acc[item.supplier_id] = {
          supplierName: item.supplier_name,
          items: []
        };
      }
      acc[item.supplier_id].items.push(item);
      return acc;
    }, {});

    let ordersCreated = 0;

    // Create a Purchase Order for each supplier
    for (const [supplierId, data] of Object.entries(itemsBySupplier)) {
      // Create PO
      const poInsertQuery = `
        INSERT INTO purchase_orders (supplier_id, status, notes)
        VALUES ($1, 'PENDING', $2)
        RETURNING id
      `;
      const poNotes = `Automated purchase order generated due to low stock.`;
      const poResult = await client.query(poInsertQuery, [supplierId, poNotes]);
      const poId = poResult.rows[0].id;

      // Add PO Items
      for (const item of data.items) {
        // Calculate a default reorder quantity, e.g., 2 times the reorder level or a fixed logic
        const orderQuantity = Math.max(item.reorder_level * 2 - item.quantity, 10); 

        const poiInsertQuery = `
          INSERT INTO purchase_order_items (purchase_order_id, inventory_id, quantity)
          VALUES ($1, $2, $3)
        `;
        await client.query(poiInsertQuery, [poId, item.inventory_id, orderQuantity]);
      }

      ordersCreated++;

      // Notify Admin
      try {
        await createNotification(
          null, // system generated
          'ADMIN', // assuming role or user_id depending on how notifications work
          'AUTOMATED_PO_GENERATED',
          `Automated Purchase Order generated for ${data.supplierName}.`,
          `/inventory/purchase-orders/${poId}` // link to frontend
        );
      } catch (notifErr) {
        logger.error(`Failed to send notification for PO ${poId}`, notifErr);
      }
    }

    await client.query('COMMIT');
    logger.info(`Automated ordering job completed successfully. Created ${ordersCreated} purchase orders.`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in automated ordering job:', error);
  } finally {
    client.release();
  }
};

/**
 * Starts the cron job for automated ordering.
 * Runs every day at midnight by default.
 */
const startAutomatedOrderingScheduler = () => {
  const schedule = process.env.AUTOMATED_ORDERING_CRON || '0 0 * * *'; // Run daily at 12 AM
  
  if (!cron.validate(schedule)) {
    logger.error(`[Automated Ordering] Invalid cron schedule: "${schedule}"`);
    return;
  }

  logger.info(`[Automated Ordering] Scheduler started. Will run at: ${schedule}`);
  
  cron.schedule(schedule, async () => {
    try {
      await processAutomatedOrdering();
    } catch (err) {
      logger.error('[Automated Ordering] Unhandled error in scheduling automated ordering:', err);
    }
  });
};

module.exports = {
  processAutomatedOrdering,
  startAutomatedOrderingScheduler
};
