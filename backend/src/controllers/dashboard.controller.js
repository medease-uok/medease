const db = require('../config/database');

const getStats = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let stats = [];

    switch (role) {
      case 'admin': {
        const result = await db.query(`
          SELECT
            (SELECT COUNT(*) FROM patients) AS total_patients,
            (SELECT COUNT(*) FROM doctors) AS total_doctors,
            (SELECT COUNT(*) FROM appointments WHERE status = 'in_progress') AS appointments_today,
            (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') AS active_prescriptions
        `);
        const r = result.rows[0];
        stats = [
          { label: 'Total Patients', value: parseInt(r.total_patients), color: '#3182ce' },
          { label: 'Total Doctors', value: parseInt(r.total_doctors), color: '#38a169' },
          { label: 'Appointments Today', value: parseInt(r.appointments_today), color: '#d69e2e' },
          { label: 'Active Prescriptions', value: parseInt(r.active_prescriptions), color: '#e53e3e' },
        ];
        break;
      }

      case 'doctor': {
        const result = await db.query(`
          SELECT
            (SELECT COUNT(*) FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE d.user_id = $1 AND a.status = 'in_progress') AS appointments_today,
            (SELECT COUNT(*) FROM patients) AS total_patients,
            (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') AS active_prescriptions,
            (SELECT COUNT(*) FROM lab_reports) AS lab_reports
        `, [userId]);
        const r = result.rows[0];
        stats = [
          { label: 'Appointments Today', value: parseInt(r.appointments_today), color: '#3182ce' },
          { label: 'Total Patients', value: parseInt(r.total_patients), color: '#38a169' },
          { label: 'Active Prescriptions', value: parseInt(r.active_prescriptions), color: '#d69e2e' },
          { label: 'Lab Reports', value: parseInt(r.lab_reports), color: '#e53e3e' },
        ];
        break;
      }

      case 'nurse': {
        const result = await db.query(`
          SELECT
            (SELECT COUNT(*) FROM appointments WHERE status = 'in_progress') AS appointments_today,
            (SELECT COUNT(*) FROM patients) AS total_patients,
            (SELECT COUNT(*) FROM medical_records) AS medical_records,
            (SELECT COUNT(*) FROM appointments WHERE status = 'completed') AS completed
        `);
        const r = result.rows[0];
        stats = [
          { label: 'Appointments Today', value: parseInt(r.appointments_today), color: '#3182ce' },
          { label: 'Total Patients', value: parseInt(r.total_patients), color: '#38a169' },
          { label: 'Medical Records', value: parseInt(r.medical_records), color: '#d69e2e' },
          { label: 'Completed', value: parseInt(r.completed), color: '#e53e3e' },
        ];
        break;
      }

      case 'lab_technician': {
        const result = await db.query(`
          SELECT
            (SELECT COUNT(*) FROM lab_reports) AS total_reports,
            (SELECT COUNT(DISTINCT patient_id) FROM lab_reports) AS patients_tested,
            (SELECT COUNT(*) FROM lab_reports WHERE report_date >= date_trunc('month', NOW())) AS tests_this_month
        `);
        const r = result.rows[0];
        stats = [
          { label: 'Total Reports', value: parseInt(r.total_reports), color: '#3182ce' },
          { label: 'Patients Tested', value: parseInt(r.patients_tested), color: '#38a169' },
          { label: 'Tests This Month', value: parseInt(r.tests_this_month), color: '#d69e2e' },
          { label: 'Pending Reviews', value: 0, color: '#e53e3e' },
        ];
        break;
      }

      case 'pharmacist': {
        const result = await db.query(`
          SELECT
            (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') AS active_rx,
            (SELECT COUNT(*) FROM prescriptions WHERE status = 'dispensed') AS dispensed,
            (SELECT COUNT(*) FROM prescriptions WHERE status = 'expired') AS expired,
            (SELECT COUNT(*) FROM prescriptions) AS total
        `);
        const r = result.rows[0];
        stats = [
          { label: 'Active Prescriptions', value: parseInt(r.active_rx), color: '#3182ce' },
          { label: 'Dispensed', value: parseInt(r.dispensed), color: '#38a169' },
          { label: 'Expired', value: parseInt(r.expired), color: '#d69e2e' },
          { label: 'Total Medications', value: parseInt(r.total), color: '#e53e3e' },
        ];
        break;
      }

      case 'patient':
      default: {
        const patientResult = await db.query(
          'SELECT id FROM patients WHERE user_id = $1', [userId]
        );
        const patientId = patientResult.rows[0]?.id;

        if (patientId) {
          const result = await db.query(`
            SELECT
              (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) AS my_appointments,
              (SELECT COUNT(*) FROM prescriptions WHERE patient_id = $1) AS my_prescriptions,
              (SELECT COUNT(*) FROM lab_reports WHERE patient_id = $1) AS my_lab_reports,
              (SELECT COUNT(*) FROM medical_records WHERE patient_id = $1) AS my_records
          `, [patientId]);
          const r = result.rows[0];
          stats = [
            { label: 'My Appointments', value: parseInt(r.my_appointments), color: '#3182ce' },
            { label: 'My Prescriptions', value: parseInt(r.my_prescriptions), color: '#38a169' },
            { label: 'My Lab Reports', value: parseInt(r.my_lab_reports), color: '#d69e2e' },
            { label: 'My Records', value: parseInt(r.my_records), color: '#e53e3e' },
          ];
        } else {
          stats = [
            { label: 'My Appointments', value: 0, color: '#3182ce' },
            { label: 'My Prescriptions', value: 0, color: '#38a169' },
            { label: 'My Lab Reports', value: 0, color: '#d69e2e' },
            { label: 'My Records', value: 0, color: '#e53e3e' },
          ];
        }
        break;
      }
    }

    // Recent appointments (for all roles)
    let recentQuery;
    let recentParams = [];

    const baseRecent = `
      SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id`;

    if (role === 'patient') {
      const patientResult = await db.query(
        'SELECT id FROM patients WHERE user_id = $1', [userId]
      );
      const patientId = patientResult.rows[0]?.id;
      if (patientId) {
        recentQuery = `${baseRecent} WHERE a.patient_id = $1 ORDER BY a.scheduled_at DESC LIMIT 5`;
        recentParams = [patientId];
      }
    } else if (role === 'doctor') {
      const doctorResult = await db.query(
        'SELECT id FROM doctors WHERE user_id = $1', [userId]
      );
      const doctorId = doctorResult.rows[0]?.id;
      if (doctorId) {
        recentQuery = `${baseRecent} WHERE a.doctor_id = $1 ORDER BY a.scheduled_at DESC LIMIT 5`;
        recentParams = [doctorId];
      }
    } else {
      recentQuery = `${baseRecent} ORDER BY a.scheduled_at DESC LIMIT 5`;
    }

    let recentAppointments = [];
    if (recentQuery) {
      const recentResult = await db.query(recentQuery, recentParams);
      recentAppointments = recentResult.rows.map((row) => ({
        id: row.id,
        patientName: row.patient_name,
        doctorName: row.doctor_name,
        scheduledAt: row.scheduled_at,
        status: row.status,
        notes: row.notes,
      }));
    }

    res.json({ status: 'success', data: { stats, recentAppointments } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getStats };
