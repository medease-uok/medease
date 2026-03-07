const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret';

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const ADMIN = { id: 'admin-uuid', email: 'admin@example.com', role: 'admin' };
const DOCTOR = { id: 'doctor-uuid', email: 'kamal@example.com', role: 'doctor', doctorId: 'doc-profile-1' };
const NURSE = { id: 'nurse-uuid', email: 'malini@example.com', role: 'nurse', nurseId: 'nurse-profile-1' };
const PATIENT = { id: 'patient-uuid', email: 'sarah@example.com', role: 'patient', patientId: 'pat-profile-1' };
const PHARMACIST = { id: 'pharma-uuid', email: 'tharindu@example.com', role: 'pharmacist', pharmacistId: 'pharma-profile-1' };
const LAB_TECH = { id: 'lab-uuid', email: 'nimal@example.com', role: 'lab_technician' };

const APPOINTMENT = {
  id: 'appt-1',
  patient_id: 'pat-profile-1',
  doctor_id: 'doc-profile-1',
  status: 'scheduled',
  patient_user_id: 'patient-uuid',
  doctor_user_id: 'doctor-uuid',
};

const MEDICAL_RECORD = {
  id: 'mr-1',
  patient_id: 'pat-profile-1',
  doctor_id: 'doc-profile-1',
  patient_user_id: 'patient-uuid',
};

const PRESCRIPTION = {
  id: 'rx-1',
  patient_id: 'pat-profile-1',
  doctor_id: 'doc-profile-1',
  status: 'pending',
  patient_user_id: 'patient-uuid',
};

const LAB_REPORT = {
  id: 'lr-1',
  patient_id: 'pat-profile-1',
  technician_id: 'lab-profile-1',
  patient_user_id: 'patient-uuid',
};

module.exports = {
  JWT_SECRET,
  makeToken,
  ADMIN,
  DOCTOR,
  NURSE,
  PATIENT,
  PHARMACIST,
  LAB_TECH,
  APPOINTMENT,
  MEDICAL_RECORD,
  PRESCRIPTION,
  LAB_REPORT,
};
