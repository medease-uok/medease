CREATE TYPE condition_status AS ENUM ('active', 'managed', 'resolved', 'monitoring');
CREATE TYPE condition_severity AS ENUM ('mild', 'moderate', 'severe');

CREATE TABLE chronic_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  diagnosed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  condition_name VARCHAR(255) NOT NULL,
  severity condition_severity NOT NULL DEFAULT 'moderate',
  diagnosed_date DATE,
  resolved_date DATE,
  treatment TEXT,
  medications TEXT,
  status condition_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chronic_conditions_patient ON chronic_conditions(patient_id);
CREATE INDEX idx_chronic_conditions_status ON chronic_conditions(status);
CREATE INDEX idx_chronic_conditions_diagnosed_by ON chronic_conditions(diagnosed_by);

GRANT ALL PRIVILEGES ON TABLE chronic_conditions TO medease_app;

INSERT INTO permissions (name, description, category) VALUES
  ('view_chronic_conditions', 'View all chronic condition records', 'chronic_conditions'),
  ('view_own_chronic_conditions', 'View own chronic condition records', 'chronic_conditions'),
  ('create_chronic_condition', 'Create chronic condition records', 'chronic_conditions'),
  ('edit_chronic_condition', 'Edit chronic condition records', 'chronic_conditions'),
  ('delete_chronic_condition', 'Delete chronic condition records', 'chronic_conditions');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name IN ('view_chronic_conditions', 'view_own_chronic_conditions', 'create_chronic_condition', 'edit_chronic_condition', 'delete_chronic_condition');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN ('view_chronic_conditions', 'create_chronic_condition', 'edit_chronic_condition');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN ('view_chronic_conditions');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN ('view_own_chronic_conditions');

INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('chronic_condition_admin_access', 'Admins can manage all chronic condition records', 'chronic_condition',
   '{"any": [{"subject.role": {"in": ["admin"]}}]}',
   'allow', 10),
  ('chronic_condition_patient_own', 'Patients can view their own chronic condition records', 'chronic_condition',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5);
