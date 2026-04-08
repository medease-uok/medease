const db = require('../config/database');

/**
 * Get overall system summary counts
 */
const getSystemSummary = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM patients) AS total_patients,
        (SELECT COUNT(*) FROM doctors) AS total_doctors,
        (SELECT COUNT(*) FROM appointments) AS total_appointments,
        (SELECT COUNT(*) FROM prescriptions) AS total_prescriptions,
        (SELECT COUNT(*) FROM users WHERE is_active = true) AS active_users
    `);

    const stats = result.rows[0];
    
    res.json({
      status: 'success',
      data: {
        totalPatients: parseInt(stats.total_patients),
        totalDoctors: parseInt(stats.total_doctors),
        totalAppointments: parseInt(stats.total_appointments),
        totalPrescriptions: parseInt(stats.total_prescriptions),
        activeUsers: parseInt(stats.active_users)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get detailed inventory statistics
 */
const getInventoryStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) AS total_items,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN quantity > 0 AND quantity <= reorder_level THEN 1 ELSE 0 END) AS low_stock,
        SUM(CASE WHEN expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) AS expired,
        SUM(CASE WHEN expiry_date >= CURRENT_DATE AND expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) AS expiring_soon
      FROM inventory
      WHERE deleted_at IS NULL
    `);

    const stats = result.rows[0];

    res.json({
      status: 'success',
      data: {
        totalItems: parseInt(stats.total_items),
        outOfStock: parseInt(stats.out_of_stock),
        lowStock: parseInt(stats.low_stock),
        expired: parseInt(stats.expired),
        expiringSoon: parseInt(stats.expiring_soon)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get appointment trends for the last 7 days
 */
const getAppointmentTrends = async (req, res, next) => {
  try {
    const result = await db.query(`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date AS date
      )
      SELECT 
        d.date,
        COUNT(a.id) FILTER (WHERE a.status = 'completed') AS completed,
        COUNT(a.id) FILTER (WHERE a.status = 'cancelled') AS cancelled,
        COUNT(a.id) FILTER (WHERE a.status = 'no_show') AS no_show,
        COUNT(a.id) AS total
      FROM days d
      LEFT JOIN appointments a ON DATE(a.scheduled_at) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    res.json({
      status: 'success',
      data: result.rows.map(row => ({
        date: row.date,
        completed: parseInt(row.completed),
        cancelled: parseInt(row.cancelled),
        noShow: parseInt(row.no_show),
        total: parseInt(row.total)
      }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user activity trends (logins and actions)
 */
const getUserActivityStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date AS date
      )
      SELECT 
        d.date,
        COUNT(al.id) FILTER (WHERE al.action ILIKE '%login%') AS logins,
        COUNT(al.id) AS total_actions
      FROM days d
      LEFT JOIN audit_logs al ON DATE(al.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    res.json({
      status: 'success',
      data: result.rows.map(row => ({
        date: row.date,
        logins: parseInt(row.logins),
        totalActions: parseInt(row.total_actions)
      }))
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemSummary,
  getInventoryStats,
  getAppointmentTrends,
  getUserActivityStats
};
