const pool = require('../config/database');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates supplier input body and returns field-level errors if any.
 * Only `name` is strictly required. Optional fields are validated for format/length if present.
 */
const validateSupplier = (body) => {
  const { name, contact_person, email, phone, address, status, notes } = body;
  const errors = {};

  const sanitized = {
    name: name?.trim(),
    contact_person: contact_person?.trim() || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    status: status?.trim() || 'active',
    notes: notes?.trim() || null
  };

  if (!sanitized.name) {
    errors.name = 'Supplier name is required.';
  } else if (sanitized.name.length > 255) {
    errors.name = 'Supplier name cannot exceed 255 characters.';
  }

  if (sanitized.email) {
    if (!EMAIL_REGEX.test(sanitized.email)) {
      errors.email = 'Invalid email format.';
    } else if (sanitized.email.length > 255) {
      errors.email = 'Email cannot exceed 255 characters.';
    }
  }

  if (sanitized.phone && sanitized.phone.length > 50) {
    errors.phone = 'Phone number cannot exceed 50 characters.';
  }

  if (sanitized.contact_person && sanitized.contact_person.length > 255) {
    errors.contact_person = 'Contact person name cannot exceed 255 characters.';
  }

  if (!['active', 'inactive'].includes(sanitized.status)) {
    errors.status = 'Invalid status value. Must be active or inactive.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
};

exports.getAllSuppliers = async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 50, 200));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const conditions = ['deleted_at IS NULL'];
    const values = [];

    if (search) {
      values.push(search);
      // NOTE: FTS expression must match the GIN index definition in 21-suppliers.sql exactly.
      conditions.push(
        `to_tsvector('english', name || ' ' || COALESCE(contact_person, '') || ' ' || COALESCE(email, '')) @@ plainto_tsquery('english', $${values.length})`
      );
    }

    if (status && ['active', 'inactive'].includes(status)) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);

    // Using COUNT(*) OVER() window function for atomic count — avoids race condition between two queries.
    const query = `
      SELECT
        id, name, contact_person, email, phone, address, status, notes, created_at, updated_at,
        COUNT(*) OVER() AS total_count
      FROM suppliers
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await pool.query(query, values);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    const data = result.rows.map(row => {
      const { total_count, ...rest } = row;
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
      SELECT id, name, contact_person, email, phone, address, status, notes, created_at, updated_at
      FROM suppliers
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      // Returns 404 for both soft-deleted and non-existent records intentionally (security by obscurity).
      return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.addSupplier = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateSupplier(req.body);

    if (!isValid) {
      return res.status(400).json({ status: 'error', errors, message: 'Validation failed' });
    }

    const query = `
      INSERT INTO suppliers (name, contact_person, email, phone, address, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, contact_person, email, phone, address, status, notes, created_at, updated_at
    `;

    const values = [
      sanitized.name,
      sanitized.contact_person,
      sanitized.email,
      sanitized.phone,
      sanitized.address,
      sanitized.status,
      sanitized.notes
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

    const { isValid, errors, sanitized } = validateSupplier(req.body);

    if (!isValid) {
      return res.status(400).json({ status: 'error', errors, message: 'Validation failed' });
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
      RETURNING id, name, contact_person, email, phone, address, status, notes, created_at, updated_at
    `;

    const values = [
      sanitized.name,
      sanitized.contact_person,
      sanitized.email,
      sanitized.phone,
      sanitized.address,
      sanitized.status,
      sanitized.notes,
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

    // Explicitly set updated_at on soft delete for accurate audit trail.
    const query = `
      UPDATE suppliers
      SET
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    }

    res.json({ status: 'success', message: 'Supplier deleted successfully', data: { id: result.rows[0].id } });
  } catch (error) {
    next(error);
  }
};
