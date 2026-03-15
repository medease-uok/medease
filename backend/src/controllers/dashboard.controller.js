const db = require('../config/database');

const TODAY_LIMIT = 20;
const UPCOMING_LIMIT = 10;
const RECENT_LIMIT = 5;

const mapAppointment = (row) => ({
  id: row.id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  scheduledAt: row.scheduled_at,
  status: row.status,
  notes: row.notes,
});

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

    const baseRecent = `
      SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id`;

    let roleFilter = '';
    let filterParams = [];
    const emptyResponse = { stats, todayAppointments: [], upcomingAppointments: [], recentAppointments: [] };

    if (role === 'patient') {
      const patientResult = await db.query(
        'SELECT id FROM patients WHERE user_id = $1', [userId]
      );
      const patientId = patientResult.rows[0]?.id;
      if (!patientId) {
        return res.json({ status: 'success', data: emptyResponse });
      }
      roleFilter = 'AND a.patient_id = $1';
      filterParams = [patientId];
    } else if (role === 'doctor') {
      const doctorResult = await db.query(
        'SELECT id FROM doctors WHERE user_id = $1', [userId]
      );
      const doctorId = doctorResult.rows[0]?.id;
      if (!doctorId) {
        return res.json({ status: 'success', data: emptyResponse });
      }
      roleFilter = 'AND a.doctor_id = $1';
      filterParams = [doctorId];
    }

    const limitIdx = filterParams.length + 1;

    const [todayResult, upcomingResult, recentResult] = await Promise.all([
      db.query(
        `${baseRecent}
         WHERE DATE(a.scheduled_at) = CURRENT_DATE
           AND a.status NOT IN ('cancelled', 'no_show')
           ${roleFilter}
         ORDER BY a.scheduled_at ASC
         LIMIT $${limitIdx}`,
        [...filterParams, TODAY_LIMIT]
      ),
      // Upcoming: future dates only (excludes today), scheduled or confirmed
      db.query(
        `${baseRecent}
         WHERE DATE(a.scheduled_at) > CURRENT_DATE
           AND a.status IN ('scheduled', 'confirmed')
           ${roleFilter}
         ORDER BY a.scheduled_at ASC
         LIMIT $${limitIdx}`,
        [...filterParams, UPCOMING_LIMIT]
      ),
      db.query(
        `${baseRecent}
         ${roleFilter ? `WHERE ${roleFilter.replace('AND ', '')}` : ''}
         ORDER BY a.scheduled_at DESC
         LIMIT $${limitIdx}`,
        [...filterParams, RECENT_LIMIT]
      ),
    ]);

    res.json({
      status: 'success',
      data: {
        stats,
        todayAppointments: todayResult.rows.map(mapAppointment),
        upcomingAppointments: upcomingResult.rows.map(mapAppointment),
        recentAppointments: recentResult.rows.map(mapAppointment),
      },
    });
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

const MAX_TODAY_APPOINTMENTS = 20;
const MAX_UPCOMING_APPOINTMENTS = 10;
const MAX_RECENT_PATIENTS = 10;
const MAX_RECENT_PRESCRIPTIONS = 10;

function mapDoctorAppointment(row) {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientId: row.patient_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    notes: row.notes,
  };
}

const getDoctorDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const doctorResult = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      return res.status(403).json({ status: 'error', message: 'Not a doctor account.' });
    }
    const doctorId = doctorResult.rows[0].id;

    const [statsResult, todayAptsResult, upcomingAptsResult, recentPatientsResult, recentRxResult] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = $1 AND a.status IN ('scheduled', 'confirmed', 'in_progress') AND DATE(a.scheduled_at) = CURRENT_DATE) AS today_appointments,
          (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = $1 AND a.status = 'completed' AND DATE(a.scheduled_at) = CURRENT_DATE) AS completed_today,
          (SELECT COUNT(DISTINCT a.patient_id) FROM appointments a WHERE a.doctor_id = $1) AS total_patients,
          (SELECT COUNT(*) FROM prescriptions WHERE doctor_id = $1 AND status = 'active') AS active_prescriptions,
          (SELECT COUNT(*) FROM medical_records WHERE doctor_id = $1) AS total_records,
          (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = $1 AND a.status IN ('scheduled', 'confirmed') AND a.scheduled_at > NOW()) AS upcoming_count
      `, [doctorId]),

      db.query(`
        SELECT a.id, a.scheduled_at, a.status, a.notes,
               pu.first_name || ' ' || pu.last_name AS patient_name,
               p.id AS patient_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        WHERE a.doctor_id = $1
          AND a.status NOT IN ('cancelled', 'no_show')
          AND DATE(a.scheduled_at) = CURRENT_DATE
        ORDER BY a.scheduled_at ASC
        LIMIT $2
      `, [doctorId, MAX_TODAY_APPOINTMENTS]),

      db.query(`
        SELECT a.id, a.scheduled_at, a.status, a.notes,
               pu.first_name || ' ' || pu.last_name AS patient_name,
               p.id AS patient_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        WHERE a.doctor_id = $1 AND a.status IN ('scheduled', 'confirmed') AND a.scheduled_at > NOW()
        ORDER BY a.scheduled_at ASC
        LIMIT $2
      `, [doctorId, MAX_UPCOMING_APPOINTMENTS]),

      db.query(`
        SELECT patient_id, patient_name, last_visit, last_status
        FROM (
          SELECT DISTINCT ON (p.id)
                 p.id AS patient_id,
                 pu.first_name || ' ' || pu.last_name AS patient_name,
                 a.scheduled_at AS last_visit,
                 a.status AS last_status
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users pu ON p.user_id = pu.id
          WHERE a.doctor_id = $1
          ORDER BY p.id, a.scheduled_at DESC
        ) sub
        ORDER BY last_visit DESC
        LIMIT $2
      `, [doctorId, MAX_RECENT_PATIENTS]),

      db.query(`
        SELECT rx.id, rx.medication, rx.dosage, rx.frequency, rx.status, rx.created_at,
               pu.first_name || ' ' || pu.last_name AS patient_name
        FROM prescriptions rx
        JOIN patients p ON rx.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        WHERE rx.doctor_id = $1
        ORDER BY rx.created_at DESC
        LIMIT $2
      `, [doctorId, MAX_RECENT_PRESCRIPTIONS]),
    ]);

    const stats = statsResult.rows[0];

    res.json({
      status: 'success',
      data: {
        stats: {
          todayAppointments: parseInt(stats.today_appointments, 10),
          completedToday: parseInt(stats.completed_today, 10),
          totalPatients: parseInt(stats.total_patients, 10),
          activePrescriptions: parseInt(stats.active_prescriptions, 10),
          totalRecords: parseInt(stats.total_records, 10),
          upcomingCount: parseInt(stats.upcoming_count, 10),
        },
        todayAppointments: todayAptsResult.rows.map(mapDoctorAppointment),
        upcomingAppointments: upcomingAptsResult.rows.map(mapDoctorAppointment),
        recentPatients: recentPatientsResult.rows.map((r) => ({
          patientId: r.patient_id,
          patientName: r.patient_name,
          lastVisit: r.last_visit,
          lastStatus: r.last_status,
        })),
        recentPrescriptions: recentRxResult.rows.map((r) => ({
          id: r.id,
          medication: r.medication,
          dosage: r.dosage,
          frequency: r.frequency,
          status: r.status,
          patientName: r.patient_name,
          createdAt: r.created_at,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

const QUEUE_LIMIT = 30;
const QUEUE_POLL_INTERVAL_HINT = 30; // seconds — sent to clients so they know when to refetch

const getPatientQueue = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    let roleQueueFilter = '';
    const params = [QUEUE_LIMIT];
    const emptyQueue = { queue: [], pollInterval: QUEUE_POLL_INTERVAL_HINT };

    if (role === 'doctor') {
      // Doctors see only their own queue
      const doctorResult = await db.query(
        'SELECT id FROM doctors WHERE user_id = $1', [userId]
      );
      const doctorId = doctorResult.rows[0]?.id;
      if (!doctorId) {
        return res.json({ status: 'success', data: emptyQueue });
      }
      roleQueueFilter = 'AND a.doctor_id = $2';
      params.push(doctorId);
    } else if (role === 'nurse') {
      // Nurses see only their department's doctors' queue
      const nurseResult = await db.query(
        'SELECT department FROM nurses WHERE user_id = $1', [userId]
      );
      const department = nurseResult.rows[0]?.department;
      if (!department) {
        return res.json({ status: 'success', data: emptyQueue });
      }
      roleQueueFilter = 'AND d.department = $2';
      params.push(department);
    }

    const result = await db.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
              pu.first_name || ' ' || pu.last_name AS patient_name,
              'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
              d.specialization, d.department
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE DATE(a.scheduled_at) = CURRENT_DATE
         AND a.status IN ('scheduled', 'confirmed', 'in_progress')
         ${roleQueueFilter}
       ORDER BY
         CASE a.status WHEN 'in_progress' THEN 0 ELSE 1 END,
         a.scheduled_at ASC
       LIMIT $1`,
      params
    );

    const queue = result.rows.map((row, idx) => ({
      position: idx + 1,
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      doctorName: row.doctor_name,
      specialization: row.specialization,
      department: row.department,
      scheduledAt: row.scheduled_at,
      status: row.status,
      notes: row.notes,
    }));

    res.json({
      status: 'success',
      data: { queue, pollInterval: QUEUE_POLL_INTERVAL_HINT },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getStats, getActivity, getDoctorDashboard, getPatientQueue };
