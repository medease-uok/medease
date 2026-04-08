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
const medicalDocumentRoutes = require('./medicalDocuments.routes');
const nurseRoutes = require('./nurses.routes');
const scheduleRoutes = require('./schedules.routes');
const medicineRoutes = require('./medicines.routes');
const prescriptionTemplateRoutes = require('./prescriptionTemplates.routes');
const patientFeedbackRoutes = require('./patientFeedback.routes');
const labTestRequestRoutes = require('./labTestRequests.routes');
const doctorTaskRoutes = require('./doctorTasks.routes');
const nurseTaskRoutes = require('./nurseTasks.routes');
const icd10Routes = require('./icd10.routes');
const inventoryRoutes = require('./inventory.routes');
const waitlistRoutes = require('./waitlist.routes');
const supplierRoutes = require('./supplier.routes');
const purchaseOrdersRoutes = require('./purchaseOrders.routes');
const reportRoutes = require('./report.routes');
const auditRoutes = require('./audit.routes');
const statisticsRoutes = require('./statistics.routes');

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
router.use('/medical-documents', medicalDocumentRoutes);
router.use('/nurses', nurseRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/medicines', medicineRoutes);
router.use('/prescription-templates', prescriptionTemplateRoutes);
router.use('/patient-feedback', patientFeedbackRoutes);
router.use('/lab-test-requests', labTestRequestRoutes);
router.use('/doctor-tasks', doctorTaskRoutes);
router.use('/nurse-tasks', nurseTaskRoutes);
router.use('/icd10', icd10Routes);
router.use('/inventory', inventoryRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/statistics', statisticsRoutes);

module.exports = router;
