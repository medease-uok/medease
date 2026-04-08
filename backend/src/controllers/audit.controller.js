const { query } = require('../config/database');

exports.getAuditLogs = async (req, res, next) => {
  console.log(`[AuditLogs] Request started: ${req.method} ${req.url}`);
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const {
      action,
      resource_type,
      success,
      from,
      to,
      search,
    } = req.query;

    const conditions = [];
    const params = [];

    if (action) {
      params.push(action);
      conditions.push(`a.action = $${params.length}`);
    }

    if (resource_type) {
      params.push(resource_type);
      conditions.push(`a.resource_type = $${params.length}`);
    }

    if (success !== undefined && success !== '') {
      params.push(success === 'true');
      conditions.push(`a.success = $${params.length}`);
    }

    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ status: 'error', message: 'Invalid "from" date.' });
      }
      params.push(fromDate.toISOString());
      conditions.push(`a.created_at >= $${params.length}::timestamp`);
    }

    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ status: 'error', message: 'Invalid "to" date.' });
      }
      params.push(toDate.toISOString());
      conditions.push(`a.created_at <= $${params.length}::timestamp + interval '1 day'`);
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(
        u.first_name ILIKE $${idx} OR 
        u.last_name ILIKE $${idx} OR 
        u.email ILIKE $${idx} OR
        a.details::text ILIKE $${idx}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        a.id, 
        a.action, 
        a.resource_type, 
        a.resource_id, 
        a.ip_address, 
        a.success, 
        a.details, 
        a.created_at, 
        u.email AS user_email, 
        u.first_name AS user_first_name, 
        u.last_name AS user_last_name, 
        u.role AS user_role 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
    `;

    const queryParams = [...params, limit, offset];

    const [result, countResult] = await Promise.all([
      query(sqlQuery, queryParams),
      query(countQuery, params),
    ]);

    const total = countResult.rows?.[0] ? parseInt(countResult.rows[0].count, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    console.log(`[AuditLogs] Request finished, returning ${result.rows?.length || 0} rows.`);
    res.json({
      status: 'success',
      data: result.rows || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
