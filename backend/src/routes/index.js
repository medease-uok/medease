const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patients.routes');
const doctorRoutes = require('./doctors.routes');
const appointmentRoutes = require('./appointments.routes');
const medicalRecordRoutes = require('./medicalRecords.routes');
const prescriptionRoutes = require('./prescriptions.routes');
const labReportRoutes = require('./labReports.routes');
const adminRoutes = require('./admin.routes');
const rolesRoutes = require('./roles.routes');
const abacRoutes = require('./abac.routes');
const dashboardRoutes = require('./dashboard.routes');
const profileRoutes = require('./profile.routes');
const notificationRoutes = require('./notifications.routes');
const refillRequestRoutes = require('./refillRequests.routes');

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MedEase API',
    version: 'v1',
  });
});

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/lab-reports', labReportRoutes);
router.use('/admin', adminRoutes);
router.use('/roles', rolesRoutes);
router.use('/abac-policies', abacRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/refill-requests', refillRequestRoutes);

module.exports = router;
