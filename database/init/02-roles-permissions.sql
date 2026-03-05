-- MedEase Roles & Permissions Schema
-- Adds granular permission-based access control on top of the existing role system.

-- Permissions table: each row is a granular action (e.g. "view_patients", "create_prescription")
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Roles table: named roles that group permissions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction: which permissions belong to which role
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Link users to roles (a user can have one role — matches existing system)
-- This replaces the enum-based role column over time, but we keep both for backward compat.
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Indexes
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- Grant to app role
GRANT ALL PRIVILEGES ON TABLE permissions TO medease_app;
GRANT ALL PRIVILEGES ON TABLE roles TO medease_app;
GRANT ALL PRIVILEGES ON TABLE role_permissions TO medease_app;
GRANT ALL PRIVILEGES ON TABLE user_roles TO medease_app;

-- ============================================
-- DEFAULT PERMISSIONS
-- ============================================

-- Patient management
INSERT INTO permissions (name, description, category) VALUES
  ('view_patients', 'View patient list and profiles', 'patients'),
  ('view_own_profile', 'View own patient profile', 'patients'),
  ('edit_own_profile', 'Edit own patient profile', 'patients'),
  ('edit_patient', 'Edit any patient profile', 'patients');

-- Appointments
INSERT INTO permissions (name, description, category) VALUES
  ('view_appointments', 'View all appointments', 'appointments'),
  ('view_own_appointments', 'View own appointments', 'appointments'),
  ('create_appointment', 'Create new appointments', 'appointments'),
  ('cancel_appointment', 'Cancel appointments', 'appointments'),
  ('update_appointment_status', 'Update appointment status', 'appointments');

-- Medical records
INSERT INTO permissions (name, description, category) VALUES
  ('view_medical_records', 'View all medical records', 'medical_records'),
  ('view_own_medical_records', 'View own medical records', 'medical_records'),
  ('create_medical_record', 'Create medical records', 'medical_records'),
  ('edit_medical_record', 'Edit medical records', 'medical_records');

-- Prescriptions
INSERT INTO permissions (name, description, category) VALUES
  ('view_prescriptions', 'View all prescriptions', 'prescriptions'),
  ('view_own_prescriptions', 'View own prescriptions', 'prescriptions'),
  ('create_prescription', 'Create prescriptions', 'prescriptions'),
  ('dispense_prescription', 'Dispense prescriptions', 'prescriptions'),
  ('cancel_prescription', 'Cancel prescriptions', 'prescriptions');

-- Lab reports
INSERT INTO permissions (name, description, category) VALUES
  ('view_lab_reports', 'View all lab reports', 'lab_reports'),
  ('view_own_lab_reports', 'View own lab reports', 'lab_reports'),
  ('create_lab_report', 'Create lab reports', 'lab_reports'),
  ('edit_lab_report', 'Edit lab reports', 'lab_reports');

-- User & system management
INSERT INTO permissions (name, description, category) VALUES
  ('manage_users', 'Activate/deactivate user accounts', 'admin'),
  ('manage_roles', 'Create and assign roles and permissions', 'admin'),
  ('view_audit_logs', 'View system audit logs', 'admin'),
  ('view_dashboard', 'View admin dashboard and analytics', 'admin');

-- ============================================
-- DEFAULT ROLES (is_system = true, cannot be deleted)
-- ============================================

INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'System administrator with full access', true),
  ('doctor', 'Medical doctor', true),
  ('nurse', 'Registered nurse', true),
  ('patient', 'Registered patient', true),
  ('lab_technician', 'Laboratory technician', true),
  ('pharmacist', 'Licensed pharmacist', true);

-- ============================================
-- ASSIGN PERMISSIONS TO DEFAULT ROLES
-- ============================================

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Doctor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN (
  'view_patients', 'edit_patient',
  'view_appointments', 'create_appointment', 'cancel_appointment', 'update_appointment_status',
  'view_medical_records', 'create_medical_record', 'edit_medical_record',
  'view_prescriptions', 'create_prescription', 'cancel_prescription',
  'view_lab_reports'
);

-- Nurse
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN (
  'view_patients',
  'view_appointments', 'update_appointment_status',
  'view_medical_records',
  'view_prescriptions',
  'view_lab_reports'
);

-- Patient
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN (
  'view_own_profile', 'edit_own_profile',
  'view_own_appointments', 'create_appointment', 'cancel_appointment',
  'view_own_medical_records',
  'view_own_prescriptions',
  'view_own_lab_reports'
);

-- Lab Technician
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'lab_technician' AND p.name IN (
  'view_patients',
  'view_lab_reports', 'create_lab_report', 'edit_lab_report'
);

-- Pharmacist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'pharmacist' AND p.name IN (
  'view_patients',
  'view_prescriptions', 'dispense_prescription'
);

-- ============================================
-- ASSIGN ROLES TO EXISTING SEED USERS
-- ============================================
-- This links existing users (from seed.sql) to their corresponding role rows.
-- Safe to run even if seed data hasn't been inserted yet (will just insert 0 rows).

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = u.role::text
ON CONFLICT DO NOTHING;
