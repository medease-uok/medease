const { query: dbQuery } = require('../config/database');

exports.getInventoryStatusReport = async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM vw_inventory_status');
    res.json({ status: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyUsageReport = async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM vw_monthly_inventory_usage ORDER BY usage_month DESC, item_name ASC');
    res.json({ status: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getAppointmentSummaryReport = async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM vw_appointment_summary ORDER BY appointment_day DESC');
    res.json({ status: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getSupplierOrderReport = async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM vw_supplier_order_summary ORDER BY last_order_date DESC NULLS LAST');
    res.json({ status: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};
