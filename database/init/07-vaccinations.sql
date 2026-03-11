-- Vaccination / Immunization History

CREATE TYPE vaccination_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');

CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  administered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  vaccine_name VARCHAR(255) NOT NULL,
  dose_number SMALLINT NOT NULL DEFAULT 1,
  lot_number VARCHAR(100),
  manufacturer VARCHAR(200),
  site VARCHAR(100),
  scheduled_date DATE,
  administered_date DATE,
  next_dose_date DATE,
  status vaccination_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_patient ON vaccinations(patient_id);
CREATE INDEX idx_vaccinations_status ON vaccinations(status);
CREATE INDEX idx_vaccinations_administered_date ON vaccinations(administered_date);
CREATE INDEX idx_vaccinations_administered_by ON vaccinations(administered_by);

GRANT ALL PRIVILEGES ON TABLE vaccinations TO medease_app;

-- Permissions
INSERT INTO permissions (name, description, category) VALUES
  ('view_vaccinations', 'View all vaccination records', 'vaccinations'),
  ('view_own_vaccinations', 'View own vaccination records', 'vaccinations'),
  ('create_vaccination', 'Create vaccination records', 'vaccinations'),
  ('edit_vaccination', 'Edit vaccination records', 'vaccinations'),
  ('delete_vaccination', 'Delete vaccination records', 'vaccinations');

-- Admin: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name IN ('view_vaccinations', 'view_own_vaccinations', 'create_vaccination', 'edit_vaccination', 'delete_vaccination');

-- Doctor: view, create, edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN ('view_vaccinations', 'create_vaccination', 'edit_vaccination');

-- Nurse: view, create, edit (nurses commonly administer vaccines)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN ('view_vaccinations', 'create_vaccination', 'edit_vaccination');

-- Patient: view own
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN ('view_own_vaccinations');

-- ABAC policies (admin + patient own records)
-- Clinical staff (doctor, nurse) access is enforced in the controller via relationship-based
-- SQL checks: doctors see only their own patients (via medical_records/prescriptions/appointments),
-- nurses see only patients in their department (via department → doctors → appointments).
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('vaccination_admin_access', 'Admins can manage all vaccination records', 'vaccination',
   '{"any": [{"subject.role": {"in": ["admin"]}}]}',
   'allow', 10),
  ('vaccination_patient_own', 'Patients can view their own vaccination records', 'vaccination',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5);
