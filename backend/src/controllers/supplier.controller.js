const pool = require('../config/database');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.getAllSuppliers = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const conditions = ['deleted_at IS NULL'];
    const values = [];

    if (search) {
      values.push(search);
      conditions.push(`to_tsvector('english', name || ' ' || COALESCE(contact_person, '') || ' ' || COALESCE(email, '')) @@ plainto_tsquery('english', $${values.length})`);
    }

    if (status && ['active', 'inactive'].includes(status)) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM suppliers
      ${whereClause}
      ORDER BY name ASC LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await pool.query(query, values);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    
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

exports.getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    }

    const query = `
      SELECT *
      FROM suppliers
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.addSupplier = async (req, res, next) => {
  try {
    const { name, contact_person, email, phone, address, status, notes } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'Supplier name is required.' });
    }
    
    const query = `
      INSERT INTO suppliers (name, contact_person, email, phone, address, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      name.trim(), 
      contact_person?.trim(), 
      email?.trim(), 
      phone?.trim(), 
      address?.trim(), 
      status || 'active', 
      notes?.trim()
    ];
    const result = await pool.query(query, values);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    }

    const { name, contact_person, email, phone, address, status, notes } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'Supplier name is required.' });
    }

    const query = `
      UPDATE suppliers
      SET 
        name = $1,
        contact_person = $2,
        email = $3,
        phone = $4,
        address = $5,
        status = $6,
        notes = $7,
        updated_at = NOW()
      WHERE id = $8 AND deleted_at IS NULL
      RETURNING *
    `;
    
    const values = [
       name.trim(), 
       contact_person?.trim(), 
       email?.trim(), 
       phone?.trim(), 
       address?.trim(), 
       status || 'active', 
       notes?.trim(),
       id
    ];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
    }
    
    const query = `
      UPDATE suppliers
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Supplier not found or already deleted' });
    }
    
    res.json({ status: 'success', message: 'Supplier logically deleted successfully', id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
};
