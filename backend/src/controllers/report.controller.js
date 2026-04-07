const { query: dbQuery } = require('../config/database');

const createReportHandler = (baseQuery, countQuery, buildParams = () => []) => async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const { query: finalQuery, countQuery: finalCountQuery, params } = buildParams(req, baseQuery, countQuery);
    
    // Add pagination
    const paginatedQuery = `${finalQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const [result, countResult] = await Promise.all([
      dbQuery(paginatedQuery, queryParams),
      dbQuery(finalCountQuery, params),
    ]);

    res.set('Cache-Control', 'private, max-age=60');
    res.json({
      status: 'success',
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryStatusReport = createReportHandler(
  'SELECT id, item_name, category, quantity, reorder_level, unit, stock_status, expiry_date, expiry_status FROM vw_inventory_status ORDER BY stock_status, item_name ASC',
  'SELECT COUNT(*) FROM vw_inventory_status',
  (req, baseQuery, countQuery) => ({ query: baseQuery, countQuery, params: [] })
);

exports.getMonthlyUsageReport = createReportHandler(
  'SELECT inventory_id, item_name, category, usage_month, total_quantity_used FROM vw_monthly_inventory_usage ORDER BY usage_month DESC, item_name ASC',
  'SELECT COUNT(*) FROM vw_monthly_inventory_usage',
  (req, baseQuery, countQuery) => ({ query: baseQuery, countQuery, params: [] })
);

exports.getAppointmentSummaryReport = createReportHandler(
  'SELECT appointment_id, scheduled_at, status, patient_id, patient_name, doctor_id, doctor_name, specialty, appointment_day FROM vw_appointment_summary',
  'SELECT COUNT(*) FROM vw_appointment_summary',
  (req, base, count) => {
    let where = [];
    let params = [];
    const { from, to } = req.query;

    if (from && to && from === to) {
        // Just as an extra precaution, though inequality usually covers it if time defaults to 00:00:00.
        // It's mostly an example.
    }

    if (from) {
      params.push(from);
      where.push(`appointment_day >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      where.push(`appointment_day <= $${params.length}::date`);
    }

    const whereClause = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
    const query = `${base}${whereClause} ORDER BY appointment_day DESC`;
    const countQuery = `${count}${whereClause}`;

    return { query, countQuery, params };
  }
);

exports.getSupplierOrderReport = createReportHandler(
  'SELECT supplier_id, supplier_name, total_orders, pending_orders, received_orders, last_order_date FROM vw_supplier_order_summary ORDER BY last_order_date DESC NULLS LAST',
  'SELECT COUNT(*) FROM vw_supplier_order_summary',
  (req, baseQuery, countQuery) => ({ query: baseQuery, countQuery, params: [] })
);
