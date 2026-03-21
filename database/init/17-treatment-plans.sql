-- Treatment plans module
CREATE TYPE treatment_plan_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
CREATE TYPE treatment_plan_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status treatment_plan_status NOT NULL DEFAULT 'active',
  priority treatment_plan_priority NOT NULL DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_doctor ON treatment_plans(doctor_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_plans_created ON treatment_plans(created_at DESC);

CREATE TABLE treatment_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treatment_plan_items_plan ON treatment_plan_items(plan_id);

GRANT ALL PRIVILEGES ON TABLE treatment_plans TO medease_app;
GRANT ALL PRIVILEGES ON TABLE treatment_plan_items TO medease_app;

-- Permissions
INSERT INTO permissions (name, description, category) VALUES
  ('view_treatment_plans', 'View all treatment plans', 'treatment_plans'),
  ('view_own_treatment_plans', 'View own treatment plans', 'treatment_plans'),
  ('create_treatment_plan', 'Create treatment plans', 'treatment_plans'),
  ('edit_treatment_plan', 'Edit treatment plans', 'treatment_plans'),
  ('delete_treatment_plan', 'Delete treatment plans', 'treatment_plans')
ON CONFLICT (name) DO NOTHING;

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name IN (
  'view_treatment_plans', 'view_own_treatment_plans',
  'create_treatment_plan', 'edit_treatment_plan', 'delete_treatment_plan'
)
ON CONFLICT DO NOTHING;

-- Doctor: view, create, edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN (
  'view_treatment_plans', 'create_treatment_plan', 'edit_treatment_plan'
)
ON CONFLICT DO NOTHING;

-- Nurse: view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN ('view_treatment_plans')
ON CONFLICT DO NOTHING;

-- Patient: view own
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN ('view_own_treatment_plans')
ON CONFLICT DO NOTHING;

-- ABAC policies
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('treatment_plan_admin_access', 'Admins can manage all treatment plans', 'treatment_plan',
   '{"any": [{"subject.role": {"in": ["admin"]}}]}',
   'allow', 10),
  ('treatment_plan_patient_own', 'Patients can view their own treatment plans', 'treatment_plan',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5)
ON CONFLICT DO NOTHING;

-- Seed data for treatment plans is in seed.sql (requires patients to exist first)
