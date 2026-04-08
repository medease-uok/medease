const { query } = require('../config/database');
const { generateCSV, generatePDF } = require('../utils/exportUtils');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { filters, params } = buildAuditFilters(req.query);
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        a.id, a.action, a.resource_type, a.resource_id, a.ip_address, a.success, a.details, a.created_at, 
        u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name, u.role AS user_role 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      query(sqlQuery, [...params, limit, offset]),
      query(countQuery, params),
    ]);

    const total = countResult.rows?.[0] ? parseInt(countResult.rows[0].count, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      status: 'success',
      data: result.rows || [],
      pagination: {
        page, limit, total, totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.exportAuditLogs = async (req, res, next) => {
  try {
    const { filters, params } = buildAuditFilters(req.query);
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';

    const exportSql = `
      SELECT 
        a.created_at, u.email AS user_email, u.first_name AS user_first_name, 
        u.last_name AS user_last_name, a.action, a.resource_type, 
        a.resource_id, a.success, a.ip_address
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 1000
    `;

    const result = await query(exportSql, params);
    
    // Set truncation header for transparency
    res.setHeader('X-Export-Truncated', result.rows.length === 1000 ? 'true' : 'false');

    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}`;
    const fields = [
      { key: 'created_at', label: 'Timestamp' },
      { key: 'user_email', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'resource_type', label: 'Resource' },
      { key: 'success', label: 'Success' },
      { key: 'ip_address', label: 'IP Address' }
    ];

    if (format === 'csv') {
      return generateCSV(res, filename, result.rows, fields);
    } else {
      return generatePDF(res, 'Audit Logs Report', filename, result.rows, fields);
    }
  } catch (error) {
    next(error);
  }
};

function buildAuditFilters(queryData) {
  const { action, resource_type, success, from, to, search } = queryData;
  const filters = [];
  const params = [];

  if (action) {
    params.push(action);
    filters.push(`a.action = $${params.length}`);
  }
  if (resource_type) {
    params.push(resource_type);
    filters.push(`a.resource_type = $${params.length}`);
  }
  if (success !== undefined && success !== '') {
    params.push(success === 'true');
    filters.push(`a.success = $${params.length}`);
  }
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      params.push(fromDate.toISOString());
      filters.push(`a.created_at >= $${params.length}::timestamp`);
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      params.push(toDate.toISOString());
      filters.push(`a.created_at <= $${params.length}::timestamp + interval '1 day'`);
    }
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    filters.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx} OR a.details::text ILIKE $${idx})`);
  }

  return { filters, params };
}
