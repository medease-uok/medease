const PATIENT_BODY = {
  firstName: 'Sarah',
  lastName: 'Fernando',
  email: 'sarah@example.com',
  phone: '712345678',
  role: 'patient',
  password: 'Str0ng@Pass',
  confirmPassword: 'Str0ng@Pass',
  dateOfBirth: '1990-05-15',
  gender: 'female',
  bloodType: 'O+',
  address: '123 Main St',
  emergencyContact: 'John Fernando',
  emergencyRelationship: 'Spouse',
  emergencyPhone: '712345679',
};

const DOCTOR_BODY = {
  firstName: 'Kamal',
  lastName: 'Perera',
  email: 'kamal@example.com',
  phone: '712345680',
  role: 'doctor',
  password: 'Str0ng@Pass',
  confirmPassword: 'Str0ng@Pass',
  specialization: 'Cardiology',
  licenseNumber: 'SLMC-12345',
  department: 'Cardiology',
};

const NURSE_BODY = {
  firstName: 'Malini',
  lastName: 'Bandara',
  email: 'malini@example.com',
  phone: '712345681',
  role: 'nurse',
  password: 'Str0ng@Pass',
  confirmPassword: 'Str0ng@Pass',
  licenseNumber: 'SLNC-54321',
  department: 'Emergency',
};

const PHARMACIST_BODY = {
  firstName: 'Tharindu',
  lastName: 'Gamage',
  email: 'tharindu@example.com',
  phone: '712345682',
  role: 'pharmacist',
  password: 'Str0ng@Pass',
  confirmPassword: 'Str0ng@Pass',
  licenseNumber: 'SLPC-99999',
};

const LAB_TECH_BODY = {
  firstName: 'Nimal',
  lastName: 'Wijesinghe',
  email: 'nimal@example.com',
  phone: '712345683',
  role: 'lab_technician',
  password: 'Str0ng@Pass',
  confirmPassword: 'Str0ng@Pass',
  department: 'Pathology',
};

const USER_ROW = {
  id: 'uuid-1',
  email: 'sarah@example.com',
  first_name: 'Sarah',
  last_name: 'Fernando',
  role: 'patient',
  is_active: false,
  created_at: '2026-01-01T00:00:00Z',
};

module.exports = {
  PATIENT_BODY,
  DOCTOR_BODY,
  NURSE_BODY,
  PHARMACIST_BODY,
  LAB_TECH_BODY,
  USER_ROW,
};
