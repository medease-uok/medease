-- MedEase Attribute-Based Access Control (ABAC)
-- Adds fine-grained, attribute-based policies on top of the RBAC system.

CREATE TABLE abac_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  effect VARCHAR(10) NOT NULL DEFAULT 'allow' CHECK (effect IN ('allow', 'deny')),
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_abac_policies_resource ON abac_policies(resource_type);
CREATE INDEX idx_abac_policies_active ON abac_policies(is_active);

GRANT ALL PRIVILEGES ON TABLE abac_policies TO medease_app;

-- ============================================
-- DEFAULT ABAC POLICIES
-- ============================================
-- Policies use a JSON condition language:
--   { "any": [...] }            — OR: at least one must be true
--   { "all": [...] }            — AND: all must be true
--   { "subject.role": { "in": ["admin"] } }         — subject attribute check
--   { "resource.patient_id": { "equals_ref": "subject.patientId" } }  — cross-attribute reference
--
-- Operators: equals, not_equals, in, not_in, equals_ref, exists, not_exists
--
-- Subject attributes (resolved from authenticated user):
--   subject.id, subject.role, subject.patientId, subject.doctorId,
--   subject.nurseId, subject.pharmacistId
--
-- Resource attributes (resolved from the database record):
--   resource.* (any column on the resource table, e.g. resource.patient_id)
--
-- Evaluation order: deny policies (highest priority first), then allow policies.
-- If no allow policy matches, access is denied by default.

-- Appointment access
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('appointment_admin_access', 'Admins and nurses can view all appointments', 'appointment',
   '{"any": [{"subject.role": {"in": ["admin", "nurse"]}}]}',
   'allow', 10),
  ('appointment_patient_own', 'Patients can view their own appointments', 'appointment',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5),
  ('appointment_doctor_own', 'Doctors can view their own appointments', 'appointment',
   '{"all": [{"subject.role": {"equals": "doctor"}}, {"resource.doctor_id": {"equals_ref": "subject.doctorId"}}]}',
   'allow', 5);

-- Medical record access
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('medical_record_admin_access', 'Admins and nurses can view all medical records', 'medical_record',
   '{"any": [{"subject.role": {"in": ["admin", "nurse"]}}]}',
   'allow', 10),
  ('medical_record_patient_own', 'Patients can view their own medical records', 'medical_record',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5),
  ('medical_record_doctor_own', 'Doctors can view medical records they created', 'medical_record',
   '{"all": [{"subject.role": {"equals": "doctor"}}, {"resource.doctor_id": {"equals_ref": "subject.doctorId"}}]}',
   'allow', 5);

-- Prescription access
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('prescription_admin_access', 'Admins can view all prescriptions', 'prescription',
   '{"any": [{"subject.role": {"in": ["admin"]}}]}',
   'allow', 10),
  ('prescription_pharmacist_access', 'Pharmacists can view all prescriptions', 'prescription',
   '{"any": [{"subject.role": {"in": ["pharmacist"]}}]}',
   'allow', 10),
  ('prescription_patient_own', 'Patients can view their own prescriptions', 'prescription',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5),
  ('prescription_doctor_own', 'Doctors can view prescriptions they created', 'prescription',
   '{"all": [{"subject.role": {"equals": "doctor"}}, {"resource.doctor_id": {"equals_ref": "subject.doctorId"}}]}',
   'allow', 5);

-- Lab report access
-- NOTE: Nurse access is department-scoped via application logic (not ABAC).
-- Nurses can only view lab reports for patients who have had appointments with
-- doctors from the nurse's department. This filtering is implemented in the
-- labReports.controller.js getAll() and getComparison() functions.
-- Admins and doctors have unrestricted access to all lab reports.
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('lab_report_privileged_access', 'Admins, doctors, and nurses can view lab reports (nurses scoped to department)', 'lab_report',
   '{"any": [{"subject.role": {"in": ["admin", "doctor", "nurse"]}}]}',
   'allow', 10),
  ('lab_report_patient_own', 'Patients can view their own lab reports', 'lab_report',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5),
  ('lab_report_technician_own', 'Lab technicians can view reports they created', 'lab_report',
   '{"all": [{"subject.role": {"equals": "lab_technician"}}, {"resource.technician_id": {"equals_ref": "subject.id"}}]}',
   'allow', 5);

-- Patient profile access
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('patient_admin_access', 'Admins, doctors, and nurses can view all patients', 'patient',
   '{"any": [{"subject.role": {"in": ["admin", "doctor", "nurse"]}}]}',
   'allow', 10),
  ('patient_own_access', 'Patients can view their own profile', 'patient',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.user_id": {"equals_ref": "subject.id"}}]}',
   'allow', 5);
