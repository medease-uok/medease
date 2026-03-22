const pool = require('../config/database');

exports.getAllInventory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        id, item_name, category, quantity, unit, reorder_level,
        expiry_date, supplier, location, last_restocked_at,
        created_at, updated_at
      FROM inventory
      ORDER BY item_name ASC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    
    // Get total count for pagination metadata
    const countResult = await pool.query('SELECT COUNT(*) FROM inventory');
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({ 
      status: 'success', 
      data: result.rows,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.addInventory = async (req, res, next) => {
  try {
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = req.body;
    
    // Validate required fields
    if (!item_name || !category || quantity === undefined || !unit || reorder_level === undefined || !expiry_date || !supplier || !location) {
      return res.status(400).json({ status: 'error', message: 'All fields are strictly required.' });
    }
    
    const query = `
      INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, last_restocked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const values = [item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location];
    const result = await pool.query(query, values);
    
    const newItem = result.rows[0];

    // Notification Logic for initial addition if stock is low
    if (newItem.quantity <= newItem.reorder_level) {
      try {
        const adminQuery = `SELECT id FROM users WHERE role = 'admin'`;
        const adminResult = await pool.query(adminQuery);
        const title = 'Low Stock Alert';
        const message = `${newItem.item_name} is added with low stock (Current: ${newItem.quantity} ${newItem.unit}). Please restock.`;
        
        for (const admin of adminResult.rows) {
          await pool.query(
            `INSERT INTO notifications (recipient_id, type, title, message, reference_id, reference_type)
             VALUES ($1, 'system', $2, $3, $4, 'inventory')`,
            [admin.id, title, message, newItem.id]
          );
        }
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr);
      }
    }

    res.status(201).json({ status: 'success', data: newItem });
  } catch (error) {
    next(error);
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = req.body;
    
    // Validate required fields
    if (!item_name || !category || quantity === undefined || !unit || reorder_level === undefined || !expiry_date || !supplier || !location) {
      return res.status(400).json({ status: 'error', message: 'All fields are strictly required.' });
    }

    // Get previous state to detect stock drop
    const oldItemResult = await pool.query('SELECT quantity, reorder_level FROM inventory WHERE id = $1', [id]);
    if (oldItemResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Inventory item not found' });
    }
    const oldItem = oldItemResult.rows[0];
    
    const query = `
      UPDATE inventory
      SET 
        item_name = $1,
        category = $2,
        quantity = $3,
        unit = $4,
        reorder_level = $5,
        expiry_date = $6,
        supplier = $7,
        location = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, id];
    const result = await pool.query(query, values);
    
    const updatedItem = result.rows[0];

    // Trigger notification if stock DROPS below or to reorder_level
    if (oldItem.quantity > updatedItem.reorder_level && updatedItem.quantity <= updatedItem.reorder_level) {
      try {
        const adminQuery = `SELECT id FROM users WHERE role = 'admin'`;
        const adminResult = await pool.query(adminQuery);
        const title = 'Low Stock Alert';
        const message = `${updatedItem.item_name} is running low (Current: ${updatedItem.quantity} ${updatedItem.unit}). Please restock.`;
        
        for (const admin of adminResult.rows) {
          await pool.query(
            `INSERT INTO notifications (recipient_id, type, title, message, reference_id, reference_type)
             VALUES ($1, 'system', $2, $3, $4, 'inventory') ON CONFLICT DO NOTHING`,
            [admin.id, title, message, updatedItem.id]
          );
        }
      } catch (notifErr) {
        console.error('Failed to send drop stock notification:', notifErr);
      }
    }
    
    res.json({ status: 'success', data: updatedItem });
  } catch (error) {
    next(error);
  }
};

exports.deleteInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const query = `
      DELETE FROM inventory
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Inventory item not found' });
    }
    
    res.json({ status: 'success', message: 'Inventory item deleted successfully', id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
};
