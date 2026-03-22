const pool = require('../config/database');

exports.getAllInventory = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        id, item_name, category, quantity, unit, reorder_level,
        expiry_date, supplier, location, last_restocked_at,
        created_at, updated_at
      FROM inventory
      ORDER BY item_name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.addInventory = async (req, res, next) => {
  try {
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = req.body;
    
    const query = `
      INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, last_restocked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const values = [item_name, category, quantity || 0, unit, reorder_level || 10, expiry_date || null, supplier || null, location || null];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location } = req.body;
    
    const query = `
      UPDATE inventory
      SET 
        item_name = COALESCE($1, item_name),
        category = COALESCE($2, category),
        quantity = COALESCE($3, quantity),
        unit = COALESCE($4, unit),
        reorder_level = COALESCE($5, reorder_level),
        expiry_date = COALESCE($6, expiry_date),
        supplier = COALESCE($7, supplier),
        location = COALESCE($8, location),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [item_name, category, quantity, unit, reorder_level, expiry_date, supplier, location, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(result.rows[0]);
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
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully', id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
};
