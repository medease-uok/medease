const pool = require('../config/database');
const { notifyAdmins } = require('../utils/notifications.helper');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.getAllInventory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const { search, category } = req.query;

    let query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM inventory
      WHERE deleted_at IS NULL
    `;
    const values = [];

    if (search) {
      values.push(search);
      query += ` AND to_tsvector('english', item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(supplier, '')) @@ plainto_tsquery('english', $${values.length})`;
    }
    
    if (category && category !== 'All') {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    query += ` ORDER BY item_name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    
    // Omit the window function count from each row response
    const data = result.rows.map(r => {
      const { total_count, ...rest } = r;
      return rest;
    });

    res.json({ 
      status: 'success', 
      data,
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
    
    // Validate required fields explicitly
    if (!item_name || !category || quantity === undefined || !unit || reorder_level === undefined || !expiry_date || !supplier || !location) {
      return res.status(400).json({ status: 'error', message: 'All fields are strictly required.' });
    }

    const qty = parseInt(quantity, 10);
    const reorder = parseInt(reorder_level, 10);
    if (isNaN(qty) || qty < 0 || isNaN(reorder) || reorder < 0) {
      return res.status(400).json({ status: 'error', message: 'quantity and reorder_level must be non-negative integers.' });
    }
    
    if (new Date(expiry_date) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ status: 'error', message: 'expiry_date must be in the future for new items.' });
    }
    
    const query = `
      INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, last_restocked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const values = [item_name, category, qty, unit, reorder, expiry_date, supplier, location];
    const result = await pool.query(query, values);
    
    const newItem = result.rows[0];

    // Notification Logic for initial addition if stock is low
    if (newItem.quantity <= newItem.reorder_level) {
      const title = 'Low Stock Alert';
      const message = `${newItem.item_name} was added with low stock (Current: ${newItem.quantity} ${newItem.unit}). Please restock.`;
      await notifyAdmins(title, message, newItem.id);
    }

    res.status(201).json({ status: 'success', data: newItem });
  } catch (error) {
    next(error);
  }
};

exports.updateInventory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = req.body;
    
    if (!UUID_REGEX.test(id)) {
      client.release();
      return res.status(400).json({ status: 'error', message: 'Invalid ID format.' });
    }

    // Validate required fields
    if (!item_name || !category || quantity === undefined || !unit || reorder_level === undefined || !expiry_date || !supplier || !location) {
      client.release();
      return res.status(400).json({ status: 'error', message: 'All fields are strictly required.' });
    }

    const qty = parseInt(quantity, 10);
    const reorder = parseInt(reorder_level, 10);
    if (isNaN(qty) || qty < 0 || isNaN(reorder) || reorder < 0) {
      client.release();
      return res.status(400).json({ status: 'error', message: 'quantity and reorder_level must be non-negative integers.' });
    }

    await client.query('BEGIN');

    // Get previous state safely utilizing row locking
    const oldItemResult = await client.query('SELECT quantity, reorder_level FROM inventory WHERE id = $1 FOR UPDATE', [id]);
    if (oldItemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
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
    
    const values = [item_name, category, qty, unit, reorder, expiry_date, supplier, location, id];
    const result = await client.query(query, values);
    
    const updatedItem = result.rows[0];

    await client.query('COMMIT');
    client.release();

    // Trigger notification cleanly comparing against old items' threshold explicitly per reviewer
    if (oldItem.quantity > oldItem.reorder_level && updatedItem.quantity <= updatedItem.reorder_level) {
      const title = 'Low Stock Alert';
      const message = `${updatedItem.item_name} is running low (Current: ${updatedItem.quantity} ${updatedItem.unit}). Please restock.`;
      await notifyAdmins(title, message, updatedItem.id);
    }
    
    res.json({ status: 'success', data: updatedItem });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    next(error);
  }
};

exports.deleteInventory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format.' });
    }
    
    // Per PR logic review requirement, implement logical softly delete with audit tracing proxy equivalent
    const query = `
      UPDATE inventory
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Inventory item not found or already deleted' });
    }
    
    res.json({ status: 'success', message: 'Inventory item logically deleted successfully', id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
};
