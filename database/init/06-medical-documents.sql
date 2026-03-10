-- Medical Documents

CREATE TYPE document_category AS ENUM (
  'lab_report', 'imaging', 'discharge_summary', 'referral',
  'insurance', 'consent_form', 'clinical_note', 'other'
);

CREATE TABLE medical_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  category document_category NOT NULL DEFAULT 'other',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_key TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_medical_documents_patient ON medical_documents(patient_id);
CREATE INDEX idx_medical_documents_uploaded_by ON medical_documents(uploaded_by);
CREATE INDEX idx_medical_documents_category ON medical_documents(category);
CREATE INDEX idx_medical_documents_created ON medical_documents(created_at);

GRANT ALL PRIVILEGES ON TABLE medical_documents TO medease_app;

-- Add notification type for document uploads
ALTER TYPE notification_type ADD VALUE 'document_uploaded';

-- Permissions
INSERT INTO permissions (name, description, category) VALUES
  ('upload_document', 'Upload medical documents', 'documents'),
  ('view_documents', 'View all medical documents', 'documents'),
  ('view_own_documents', 'View own medical documents', 'documents'),
  ('delete_document', 'Delete medical documents', 'documents');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name IN ('upload_document', 'view_documents', 'view_own_documents', 'delete_document');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN ('upload_document', 'view_documents');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN ('upload_document', 'view_documents');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN ('upload_document', 'view_own_documents');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'lab_technician' AND p.name IN ('upload_document', 'view_documents');

-- ABAC policies for medical documents
-- Note: Doctor, nurse, and lab_technician access is filtered to their own patients
-- via relationship subqueries in the controller (too complex for ABAC conditions).
INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority) VALUES
  ('document_admin_access', 'Admins can view all medical documents', 'medical_document',
   '{"any": [{"subject.role": {"in": ["admin"]}}]}',
   'allow', 10),
  ('document_patient_own', 'Patients can view their own medical documents', 'medical_document',
   '{"all": [{"subject.role": {"equals": "patient"}}, {"resource.patient_id": {"equals_ref": "subject.patientId"}}]}',
   'allow', 5);
