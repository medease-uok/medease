const { query: dbQuery, getClient } = require('../config/database');
const { notifyAdmins } = require('../utils/notifications.helper');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXPIRY_WARNING_DAYS = 30;

function validateInventoryInput({ item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location }) {
  const sanitizedName = item_name?.trim();
  
  if (!sanitizedName || sanitizedName.length === 0 || sanitizedName.length > 255 || !category || quantity === undefined || !unit || reorder_level === undefined || !expiry_date || !supplier || !location) {
    return { error: 'All fields are strictly required and item_name must be valid.' };
  }

  const qty = parseInt(quantity, 10);
  const reorder = parseInt(reorder_level, 10);
  if (isNaN(qty) || qty < 0 || qty > 2147483647 || isNaN(reorder) || reorder < 0 || reorder > 2147483647) {
    return { error: 'quantity and reorder_level must be non-negative integers up to maximum threshold.' };
  }
  
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (expiry_date && new Date(expiry_date) < today) {
    return { error: 'expiry_date must be in the future.' };
  }

  return { data: { item_name: sanitizedName, category, quantity: qty, unit, reorder_level: reorder, expiry_date, supplier, location } };
}

exports.getAllInventory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const { search, category } = req.query;

    const conditions = ['deleted_at IS NULL'];
    const values = [];

    if (search) {
      values.push(search);
      conditions.push(`to_tsvector('english', item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(supplier, '')) @@ plainto_tsquery('english', $${values.length})`);
    }
    
    if (category && category !== 'All') {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM inventory
      ${whereClause}
      ORDER BY item_name ASC LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await dbQuery(query, values);
    
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

exports.getInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    }

    const query = `
      SELECT id, item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, last_restocked_at, created_at, updated_at
      FROM inventory
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await dbQuery(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Inventory item not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.addInventory = async (req, res, next) => {
  try {
    const validation = validateInventoryInput(req.body);
    if (validation.error) {
      return res.status(400).json({ status: 'error', message: validation.error });
    }
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = validation.data;
    
    const query = `
      INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, last_restocked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const values = [item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location];
    const result = await dbQuery(query, values);
    
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
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
  }

  const validation = validateInventoryInput(req.body);
  if (validation.error) {
    return res.status(400).json({ status: 'error', message: validation.error });
  }

  let client;
  let connectionReleased = false;

  try {
    client = await getClient();
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = validation.data;
    
    await client.query('BEGIN');

    // Get previous state safely utilizing row locking
    const oldItemResult = await client.query('SELECT quantity, reorder_level FROM inventory WHERE id = $1 FOR UPDATE', [id]);
    if (oldItemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      connectionReleased = true;
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
    const result = await client.query(query, values);
    
    const updatedItem = result.rows[0];

    await client.query('COMMIT');
    client.release();
    connectionReleased = true;

    // Trigger notification cleanly outside the transaction
    if (oldItem.quantity > oldItem.reorder_level && updatedItem.quantity <= updatedItem.reorder_level) {
      const title = 'Low Stock Alert';
      const message = `${updatedItem.item_name} is running low (Current: ${updatedItem.quantity} ${updatedItem.unit}). Please restock.`;
      await notifyAdmins(title, message, updatedItem.id);
    }
    
    res.json({ status: 'success', data: updatedItem });
  } catch (error) {
    if (client && !connectionReleased) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {} // Ignore rollback failure on dead connections
      client.release();
    }
    next(error);
  }
};

exports.deleteInventory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    }
    
    // Implement logical delete
    const query = `
      UPDATE inventory
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    
    const result = await dbQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Inventory item not found or already deleted' });
    }
    
    res.json({ status: 'success', message: 'Inventory item logically deleted successfully', id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryReport = async (req, res, next) => {
  let client;
  try {
    client = await getClient();
    await client.query('BEGIN');

    // 1. Overview counts
    const overviewQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 1 END) as expired_items,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '${EXPIRY_WARNING_DAYS} days' THEN 1 END) as expiring_soon_items
      FROM inventory
      WHERE deleted_at IS NULL
    `;
    const overviewResult = await client.query(overviewQuery);
    
    // 2. Category distribution
    const categoryQuery = `
      SELECT category, COUNT(*) as count, SUM(quantity) as total_quantity
      FROM inventory
      WHERE deleted_at IS NULL
      GROUP BY category
    `;
    const categoryResult = await client.query(categoryQuery);

    // 3. Recent Transactions Trends (last 30 days)
    // Gracefully handle if inventory_transactions table doesn't exist yet.
    let trendsRows = [];
    try {
      const trendsQuery = `
        SELECT 
          DATE(created_at) as date,
          transaction_type,
          SUM(quantity_changed) as total_quantity
        FROM inventory_transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), transaction_type
        ORDER BY date ASC
      `;
      const trendsResult = await client.query(trendsQuery);
      trendsRows = trendsResult.rows;
    } catch (_) {
      // inventory_transactions table not yet created — return empty trends
    }

    await client.query('COMMIT');

    res.json({
      status: 'success',
      data: {
        overview: {
          total_items: parseInt(overviewResult.rows[0].total_items, 10),
          low_stock_items: parseInt(overviewResult.rows[0].low_stock_items, 10),
          out_of_stock_items: parseInt(overviewResult.rows[0].out_of_stock_items, 10),
          expired_items: parseInt(overviewResult.rows[0].expired_items, 10),
          expiring_soon_items: parseInt(overviewResult.rows[0].expiring_soon_items, 10)
        },
        categories: categoryResult.rows.map(row => ({
          category: row.category,
          count: parseInt(row.count) || 0,
          total_quantity: parseInt(row.total_quantity) || 0
        })),
        trends: trendsRows.map(row => ({
          date: row.date,
          transaction_type: row.transaction_type,
          total_quantity: parseInt(row.total_quantity) || 0
        }))
      }
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {}
    }
    next(error);
  } finally {
    if (client) client.release();
  }
};

exports.getTransactionLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const { rows } = await dbQuery(`
      SELECT
        t.id,
        t.transaction_type,
        t.quantity_changed,
        t.reference,
        t.created_at,
        i.item_name,
        i.category,
        COUNT(*) OVER() AS total_count
      FROM inventory_transactions t
      LEFT JOIN inventory i ON t.inventory_id = i.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    const data = rows.map(({ total_count, ...rest }) => rest);

    res.status(200).json({
      status: 'success',
      data: {
        logs: data,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
