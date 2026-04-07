const { query: dbQuery } = require('../config/database');
const { generateCSV, generatePDF } = require('../utils/exportUtils');

const createReportHandler = (baseQuery, countQuery, buildParams = () => [], exportConfig = null) => async (req, res, next) => {
  try {
    const { query: finalQuery, countQuery: finalCountQuery, params } = buildParams(req, baseQuery, countQuery);

    if (exportConfig && (req.query.format === 'csv' || req.query.format === 'pdf')) {
      const result = await dbQuery(finalQuery, params);
      const filename = `${exportConfig.title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}`;
      
      if (req.query.format === 'csv') {
        return generateCSV(res, filename, result.rows, exportConfig.fields);
      } else {
        return generatePDF(res, exportConfig.title, filename, result.rows, exportConfig.fields);
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    
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
  (req, baseQuery, countQuery) => ({ query: baseQuery, countQuery, params: [] }),
  {
    title: 'Inventory Status Report',
    fields: [
      { key: 'item_name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },
      { key: 'stock_status', label: 'Status' },
      { key: 'expiry_date', label: 'Expiry Date' },
      { key: 'expiry_status', label: 'Expiry Status' }
    ]
  }
);

exports.getMonthlyUsageReport = createReportHandler(
  'SELECT inventory_id, item_name, category, usage_month, total_quantity_used FROM vw_monthly_inventory_usage ORDER BY usage_month DESC, item_name ASC',
  'SELECT COUNT(*) FROM vw_monthly_inventory_usage',
  (req, baseQuery, countQuery) => ({ query: baseQuery, countQuery, params: [] }),
  {
    title: 'Monthly Inventory Usage',
    fields: [
      { key: 'usage_month', label: 'Usage Month' },
      { key: 'item_name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'total_quantity_used', label: 'Total Used' }
    ]
  }
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
  },
  {
    title: 'Appointments Summary',
    fields: [
      { key: 'appointment_day', label: 'Appointment Date' },
      { key: 'patient_name', label: 'Patient Name' },
      { key: 'doctor_name', label: 'Doctor Name' },
      { key: 'specialty', label: 'Specialty' },
      { key: 'status', label: 'Status' }
    ]
  }
);

exports.getSupplierOrderReport = createReportHandler(
  'SELECT supplier_id, supplier_name, total_orders, pending_orders, received_orders, last_order_date FROM vw_supplier_order_summary ORDER BY last_order_date DESC NULLS LAST',
  'SELECT COUNT(*) FROM vw_supplier_order_summary',
  (req, baseQuery, countQuery) => ({ query: baseQuery, countQuery, params: [] }),
  {
    title: 'Supplier Orders Report',
    fields: [
      { key: 'supplier_name', label: 'Supplier Name' },
      { key: 'total_orders', label: 'Total Orders' },
      { key: 'pending_orders', label: 'Pending' },
      { key: 'received_orders', label: 'Received' },
      { key: 'last_order_date', label: 'Last Order Date' }
    ]
  }
);
