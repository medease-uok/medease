const db = require('../config/database');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Get all purchase orders with inventory details
const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT po.*, i.item_name, i.category, i.unit, i.quantity as current_stock 
      FROM purchase_orders po
      LEFT JOIN inventory i ON po.inventory_id = i.id
    `;
    const params = [];
    
    if (status) {
      query += ' WHERE po.status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY po.created_at DESC';
    
    const result = await db.query(query, params);
    
    res.json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Update purchase order status
const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    }

    if (!['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }
    
    // Authorization check for 'RECEIVED' status
    if (status === 'RECEIVED' && req.user && !['admin', 'pharmacist'].includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Only admin or pharmacist can mark a PO as RECEIVED' });
    }
    
    // Begin transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const getPoQuery = 'SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE';
      const poResult = await client.query(getPoQuery, [id]);
      
      if (poResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ status: 'error', message: 'Purchase order not found' });
      }
      
      const po = poResult.rows[0];
      
      // State transition validation
      const validTransitions = {
        PENDING: ['APPROVED', 'CANCELLED'],
        APPROVED: ['ORDERED', 'CANCELLED'],
        ORDERED: ['RECEIVED', 'CANCELLED'],
        RECEIVED: [], // terminal state
        CANCELLED: [] // terminal state
      };
      
      if (po.status !== status && !validTransitions[po.status]?.includes(status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: `Invalid transition: ${po.status} → ${status}` });
      }

      // Determine which column to update based on the status action
      let queryUpdates = ['status = $1', 'updated_at = NOW()'];
      const queryParams = [status, id];
      let paramIndex = 3;
      
      if (status === 'RECEIVED' && req.user?.id) {
        queryUpdates.push(`received_by = $${paramIndex++}`);
        queryParams.push(req.user.id);
      } else if (status === 'APPROVED' && req.user?.id) {
        queryUpdates.push(`approved_by = $${paramIndex++}`);
        queryParams.push(req.user.id);
      }

      const updatePoQuery = `
        UPDATE purchase_orders 
        SET ${queryUpdates.join(', ')}
        WHERE id = $2 
        RETURNING *
      `;
      const updatedPoResult = await client.query(updatePoQuery, queryParams);
      
      // If status is newly RECEIVED, update inventory stock and create transaction log
      if (status === 'RECEIVED' && po.status !== 'RECEIVED') {
        const updateInventoryQuery = `
          UPDATE inventory 
          SET quantity = quantity + $1, last_restocked_at = NOW(), updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(updateInventoryQuery, [po.quantity, po.inventory_id]);
        
        // Insert into inventory_transactions
        await client.query(
          `INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, reference)
           VALUES ($1, 'IN', $2, $3)`,
          [po.inventory_id, po.quantity, `PO-${id}`]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        status: 'success',
        data: updatedPoResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPurchaseOrders,
  updatePurchaseOrderStatus
};
