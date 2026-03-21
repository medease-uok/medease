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

-- Seed treatment plans
INSERT INTO treatment_plans (id, patient_id, doctor_id, title, description, status, priority, start_date, end_date, notes) VALUES
  ('ab000000-0000-0000-0000-000000000001', 'ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001',
   'Hypertension Management', 'Comprehensive plan to manage Stage 1 hypertension through medication and lifestyle changes.',
   'active', 'high', '2026-03-01', '2026-09-01', 'Review blood pressure monthly. Target: <130/80 mmHg.'),
  ('ab000000-0000-0000-0000-000000000002', 'ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002',
   'Migraine Prevention', 'Preventive treatment plan for chronic migraines with medication and trigger avoidance.',
   'active', 'medium', '2026-02-15', '2026-08-15', 'Patient reports 4-5 migraines per month. Goal: reduce to <2.'),
  ('ab000000-0000-0000-0000-000000000003', 'ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003',
   'Post-Surgery Knee Rehabilitation', 'Recovery plan following ACL reconstruction surgery.',
   'active', 'high', '2026-03-10', '2026-06-10', 'Patient had surgery on 2026-03-08. Physiotherapy 3x/week.'),
  ('ab000000-0000-0000-0000-000000000004', 'ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001',
   'Cholesterol Reduction', 'Diet and medication plan to reduce LDL cholesterol levels.',
   'completed', 'medium', '2025-10-01', '2026-02-28', 'LDL reduced from 180 to 120. Plan completed successfully.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO treatment_plan_items (id, plan_id, title, description, is_completed, due_date, sort_order) VALUES
  ('ac000000-0000-0000-0000-000000000001', 'ab000000-0000-0000-0000-000000000001',
   'Start Amlodipine 5mg daily', 'Take one tablet in the morning with water.', true, '2026-03-01', 0),
  ('ac000000-0000-0000-0000-000000000002', 'ab000000-0000-0000-0000-000000000001',
   'Daily blood pressure monitoring', 'Record morning and evening readings in journal.', true, '2026-03-07', 1),
  ('ac000000-0000-0000-0000-000000000003', 'ab000000-0000-0000-0000-000000000001',
   'Reduce sodium intake', 'Limit to <2300mg/day. Avoid processed foods.', false, '2026-04-01', 2),
  ('ac000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000001',
   'Follow-up blood work', 'Check kidney function and electrolytes.', false, '2026-05-01', 3),
  ('ac000000-0000-0000-0000-000000000005', 'ab000000-0000-0000-0000-000000000002',
   'Start Propranolol 40mg twice daily', 'Take with meals. Monitor heart rate.', true, '2026-02-15', 0),
  ('ac000000-0000-0000-0000-000000000006', 'ab000000-0000-0000-0000-000000000002',
   'Maintain headache diary', 'Record triggers, duration, and severity of each episode.', false, '2026-03-15', 1),
  ('ac000000-0000-0000-0000-000000000007', 'ab000000-0000-0000-0000-000000000002',
   'Follow-up appointment', 'Assess medication effectiveness after 4 weeks.', false, '2026-04-15', 2),
  ('ac000000-0000-0000-0000-000000000008', 'ab000000-0000-0000-0000-000000000003',
   'Ice and elevation protocol', 'Ice 20min every 2 hours for first 2 weeks.', true, '2026-03-24', 0),
  ('ac000000-0000-0000-0000-000000000009', 'ab000000-0000-0000-0000-000000000003',
   'Begin physiotherapy sessions', 'Attend 3 sessions per week at hospital rehab center.', false, '2026-03-24', 1),
  ('ac000000-0000-0000-0000-000000000010', 'ab000000-0000-0000-0000-000000000003',
   'Progress to weight-bearing exercises', 'Only with physiotherapist approval.', false, '2026-04-21', 2),
  ('ac000000-0000-0000-0000-000000000011', 'ab000000-0000-0000-0000-000000000004',
   'Start Atorvastatin 20mg nightly', 'Take before bed.', true, '2025-10-01', 0),
  ('ac000000-0000-0000-0000-000000000012', 'ab000000-0000-0000-0000-000000000004',
   'Dietary consultation', 'Meet with hospital dietitian for meal planning.', true, '2025-10-15', 1),
  ('ac000000-0000-0000-0000-000000000013', 'ab000000-0000-0000-0000-000000000004',
   'Follow-up lipid panel', 'Recheck cholesterol levels after 3 months.', true, '2026-01-01', 2)
ON CONFLICT (id) DO NOTHING;
