const db = require('../config/database');

// Get all purchase orders with inventory details
const getAllPurchaseOrders = async (req, res) => {
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
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('[Purchase Orders] Error fetching orders:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update purchase order status
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    // Begin transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const getPoQuery = 'SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE';
      const poResult = await client.query(getPoQuery, [id]);
      
      if (poResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }
      
      const po = poResult.rows[0];
      
      // Update the PO status
      const updatePoQuery = `
        UPDATE purchase_orders 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `;
      const updatedPoResult = await client.query(updatePoQuery, [status, id]);
      
      // If status is RECEIVED, update inventory stock
      if (status === 'RECEIVED' && po.status !== 'RECEIVED') {
        const updateInventoryQuery = `
          UPDATE inventory 
          SET quantity = quantity + $1, last_restocked_at = NOW(), updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(updateInventoryQuery, [po.quantity, po.inventory_id]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: updatedPoResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[Purchase Orders] Error updating status:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllPurchaseOrders,
  updatePurchaseOrderStatus
};
