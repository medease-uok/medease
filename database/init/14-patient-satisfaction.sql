-- Patient Satisfaction / Feedback

CREATE TABLE patient_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  communication_rating SMALLINT CHECK (communication_rating BETWEEN 1 AND 5),
  wait_time_rating SMALLINT CHECK (wait_time_rating BETWEEN 1 AND 5),
  treatment_rating SMALLINT CHECK (treatment_rating BETWEEN 1 AND 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patient_feedback_patient ON patient_feedback(patient_id);
CREATE INDEX idx_patient_feedback_doctor ON patient_feedback(doctor_id);
CREATE INDEX idx_patient_feedback_appointment ON patient_feedback(appointment_id);
CREATE INDEX idx_patient_feedback_rating ON patient_feedback(rating);
CREATE INDEX idx_patient_feedback_created ON patient_feedback(created_at DESC);

-- Only one feedback per appointment
CREATE UNIQUE INDEX uq_feedback_appointment ON patient_feedback(appointment_id) WHERE appointment_id IS NOT NULL;

GRANT ALL PRIVILEGES ON TABLE patient_feedback TO medease_app;

-- Lab Test Requests (doctor requests lab work for a patient)

CREATE TYPE lab_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE lab_test_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'routine')),
  clinical_notes TEXT,
  status lab_request_status DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  lab_report_id UUID REFERENCES lab_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lab_test_requests_patient ON lab_test_requests(patient_id);
CREATE INDEX idx_lab_test_requests_doctor ON lab_test_requests(doctor_id);
CREATE INDEX idx_lab_test_requests_status ON lab_test_requests(status);
CREATE INDEX idx_lab_test_requests_assigned ON lab_test_requests(assigned_to);
CREATE INDEX idx_lab_test_requests_created ON lab_test_requests(created_at DESC);
CREATE INDEX idx_lab_test_requests_patient_status ON lab_test_requests(patient_id, status);

GRANT ALL PRIVILEGES ON TABLE lab_test_requests TO medease_app;

-- Permissions
INSERT INTO permissions (name, description, category) VALUES
  ('submit_feedback', 'Submit patient feedback after appointments', 'feedback'),
  ('view_feedback', 'View all patient feedback', 'feedback'),
  ('view_own_feedback', 'View own feedback', 'feedback'),
  ('view_doctor_feedback', 'View feedback for own patients', 'feedback'),
  ('request_lab_test', 'Request a lab test for a patient', 'lab_tests'),
  ('view_lab_requests', 'View all lab test requests', 'lab_tests'),
  ('update_lab_request', 'Update lab test request status', 'lab_tests');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name IN ('view_feedback', 'view_lab_requests', 'update_lab_request');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN ('view_doctor_feedback', 'request_lab_test', 'view_lab_requests');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN ('submit_feedback', 'view_own_feedback');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'lab_technician' AND p.name IN ('view_lab_requests', 'update_lab_request');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN ('view_feedback', 'view_lab_requests');
