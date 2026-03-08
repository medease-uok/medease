-- Prescription Refill Requests

CREATE TYPE refill_request_status AS ENUM ('pending', 'approved', 'denied');

CREATE TABLE prescription_refill_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  status refill_request_status DEFAULT 'pending',
  reason TEXT,
  doctor_note TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refill_requests_prescription ON prescription_refill_requests(prescription_id);
CREATE INDEX idx_refill_requests_patient ON prescription_refill_requests(patient_id);
CREATE INDEX idx_refill_requests_doctor ON prescription_refill_requests(doctor_id);
CREATE INDEX idx_refill_requests_status ON prescription_refill_requests(status);

GRANT ALL PRIVILEGES ON TABLE prescription_refill_requests TO medease_app;

-- Add notification types for refill requests
ALTER TYPE notification_type ADD VALUE 'refill_requested';
ALTER TYPE notification_type ADD VALUE 'refill_approved';
ALTER TYPE notification_type ADD VALUE 'refill_denied';

-- New permissions
INSERT INTO permissions (name, description, category) VALUES
  ('request_refill', 'Request a prescription refill', 'prescriptions'),
  ('view_refill_requests', 'View all refill requests', 'prescriptions'),
  ('view_own_refill_requests', 'View own refill requests', 'prescriptions'),
  ('respond_refill_request', 'Approve or deny refill requests', 'prescriptions');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name IN ('request_refill', 'view_refill_requests', 'view_own_refill_requests', 'respond_refill_request');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN ('view_refill_requests', 'respond_refill_request');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN ('request_refill', 'view_own_refill_requests');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN ('view_refill_requests');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'pharmacist' AND p.name IN ('view_refill_requests');

-- ABAC policies for refill requests
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('refill_request_admin_access', 'Admins can view all refill requests', 'refill_request',
   '{"any": [{"subject.role": {"in": ["admin"]}}]}',
   'allow', 10),
  ('refill_request_nurse_access', 'Nurses can view all refill requests', 'refill_request',
   '{"any": [{"subject.role": {"in": ["nurse"]}}]}',
   'allow', 10),
  ('refill_request_pharmacist_access', 'Pharmacists can view all refill requests', 'refill_request',
   '{"any": [{"subject.role": {"in": ["pharmacist"]}}]}',
   'allow', 10),
  ('refill_request_patient_own', 'Patients can view their own refill requests', 'refill_request',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5),
  ('refill_request_doctor_own', 'Doctors can view refill requests for their prescriptions', 'refill_request',
   '{"all": [{"subject.role": {"equals": "doctor"}}, {"resource.doctor_id": {"equals_ref": "subject.doctorId"}}]}',
   'allow', 5);
