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

const getActivity = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const activities = [];

    const patientId = async () => {
      const r = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
      return r.rows[0]?.id;
    };
    const doctorId = async () => {
      const r = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
      return r.rows[0]?.id;
    };

    {
      const base = `
        SELECT a.id, a.scheduled_at AS ts, a.status,
               pu.first_name || ' ' || pu.last_name AS patient_name,
               'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
               a.notes
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id`;

      let q, params = [];
      if (role === 'patient') {
        const pid = await patientId();
        if (pid) { q = `${base} WHERE a.patient_id = $1 ORDER BY a.scheduled_at DESC LIMIT 15`; params = [pid]; }
      } else if (role === 'doctor') {
        const did = await doctorId();
        if (did) { q = `${base} WHERE a.doctor_id = $1 ORDER BY a.scheduled_at DESC LIMIT 15`; params = [did]; }
      } else {
        q = `${base} ORDER BY a.scheduled_at DESC LIMIT 15`;
      }

      if (q) {
        const rows = (await db.query(q, params)).rows;
        for (const r of rows) {
          const typeMap = { scheduled: 'appointment-scheduled', completed: 'appointment-completed', cancelled: 'appointment-cancelled', in_progress: 'appointment-scheduled' };
          activities.push({
            id: `apt-${r.id}`,
            type: typeMap[r.status] || 'appointment-scheduled',
            user: r.doctor_name,
            description: `${r.patient_name} — ${r.status} with ${r.doctor_name}`,
            timestamp: r.ts,
            details: r.notes || null,
          });
        }
      }
    }

    {
      const base = `
        SELECT pr.id, pr.created_at AS ts, pr.medication, pr.status,
               pu.first_name || ' ' || pu.last_name AS patient_name,
               'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
        FROM prescriptions pr
        JOIN patients p ON pr.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN doctors d ON pr.doctor_id = d.id
        JOIN users du ON d.user_id = du.id`;

      let q, params = [];
      if (role === 'patient') {
        const pid = await patientId();
        if (pid) { q = `${base} WHERE pr.patient_id = $1 ORDER BY pr.created_at DESC LIMIT 10`; params = [pid]; }
      } else if (role === 'doctor') {
        const did = await doctorId();
        if (did) { q = `${base} WHERE pr.doctor_id = $1 ORDER BY pr.created_at DESC LIMIT 10`; params = [did]; }
      } else if (role === 'pharmacist' || role === 'admin' || role === 'nurse') {
        q = `${base} ORDER BY pr.created_at DESC LIMIT 10`;
      }

      if (q) {
        const rows = (await db.query(q, params)).rows;
        for (const r of rows) {
          activities.push({
            id: `rx-${r.id}`,
            type: 'prescription',
            user: r.doctor_name,
            description: `${r.medication} prescribed to ${r.patient_name} (${r.status})`,
            timestamp: r.ts,
            details: null,
          });
        }
      }
    }

    {
      const base = `
        SELECT mr.id, mr.created_at AS ts, mr.diagnosis,
               pu.first_name || ' ' || pu.last_name AS patient_name,
               'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN doctors d ON mr.doctor_id = d.id
        JOIN users du ON d.user_id = du.id`;

      let q, params = [];
      if (role === 'patient') {
        const pid = await patientId();
        if (pid) { q = `${base} WHERE mr.patient_id = $1 ORDER BY mr.created_at DESC LIMIT 10`; params = [pid]; }
      } else if (role === 'doctor') {
        const did = await doctorId();
        if (did) { q = `${base} WHERE mr.doctor_id = $1 ORDER BY mr.created_at DESC LIMIT 10`; params = [did]; }
      } else if (role === 'admin' || role === 'nurse') {
        q = `${base} ORDER BY mr.created_at DESC LIMIT 10`;
      }

      if (q) {
        const rows = (await db.query(q, params)).rows;
        for (const r of rows) {
          activities.push({
            id: `mr-${r.id}`,
            type: 'record-created',
            user: r.doctor_name,
            description: `Record created for ${r.patient_name}: ${r.diagnosis}`,
            timestamp: r.ts,
            details: null,
          });
        }
      }
    }

    {
      const base = `
        SELECT lr.id, lr.report_date AS ts, lr.test_name, lr.result,
               pu.first_name || ' ' || pu.last_name AS patient_name,
               COALESCE(tu.first_name || ' ' || tu.last_name, 'Lab') AS tech_name
        FROM lab_reports lr
        JOIN patients p ON lr.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        LEFT JOIN users tu ON lr.technician_id = tu.id`;

      let q, params = [];
      if (role === 'patient') {
        const pid = await patientId();
        if (pid) { q = `${base} WHERE lr.patient_id = $1 ORDER BY lr.report_date DESC LIMIT 10`; params = [pid]; }
      } else if (role === 'lab_technician') {
        q = `${base} ORDER BY lr.report_date DESC LIMIT 10`;
      } else if (role === 'doctor' || role === 'admin') {
        q = `${base} ORDER BY lr.report_date DESC LIMIT 10`;
      }

      if (q) {
        const rows = (await db.query(q, params)).rows;
        for (const r of rows) {
          activities.push({
            id: `lr-${r.id}`,
            type: 'lab-report',
            user: r.tech_name,
            description: `${r.test_name} for ${r.patient_name}: ${r.result || 'Pending'}`,
            timestamp: r.ts,
            details: null,
          });
        }
      }
    }

    if (role === 'admin') {
      const rows = (await db.query(`
        SELECT al.id, al.created_at AS ts, al.action, al.resource_type,
               al.ip_address,
               COALESCE(u.first_name || ' ' || u.last_name, 'System') AS user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 15
      `)).rows;

      for (const r of rows) {
        const actionLower = r.action.toLowerCase();
        let type = 'audit';
        if (actionLower.includes('login')) type = 'audit-login';
        else if (actionLower.includes('logout')) type = 'audit-logout';
        else if (actionLower.includes('approve') || actionLower.includes('reject') || actionLower.includes('role')) type = 'audit-admin';
        else if (actionLower.includes('view') || actionLower.includes('read') || actionLower.includes('get')) type = 'audit-view';
        else if (actionLower.includes('create') || actionLower.includes('register')) type = 'audit-create';
        else if (actionLower.includes('update') || actionLower.includes('edit')) type = 'audit-update';
        else if (actionLower.includes('delete') || actionLower.includes('remove')) type = 'audit-delete';

        const ip = r.ip_address ? `IP: ${r.ip_address}` : null;

        activities.push({
          id: `audit-${r.id}`,
          type,
          user: r.user_name,
          description: `${r.action.replace(/_/g, ' ')} (${r.resource_type})`,
          timestamp: r.ts,
          details: ip,
        });
      }
    }

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ status: 'success', data: activities.slice(0, 20) });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getStats, getActivity };
