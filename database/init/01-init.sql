-- MedEase Database Initialization
-- This script runs automatically when the PostgreSQL container starts for the first time.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medease_app') THEN
    CREATE ROLE medease_app LOGIN PASSWORD 'medease_dev_password';
  END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE medease TO medease_app;

-- Create enum types
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'admin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE prescription_status AS ENUM ('active', 'dispensed', 'expired', 'cancelled');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_type VARCHAR(5),
  address TEXT,
  profile_image_url TEXT,
  emergency_contact VARCHAR(100),
  emergency_relationship VARCHAR(50),
  emergency_phone VARCHAR(20),
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(50),
  insurance_plan_type VARCHAR(50) CHECK (insurance_plan_type IS NULL OR insurance_plan_type IN ('Inpatient', 'Outpatient', 'Comprehensive')),
  insurance_expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Nurses table
CREATE TABLE nurses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pharmacists table
CREATE TABLE pharmacists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medical records table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  medication VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  status prescription_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lab reports table
CREATE TABLE lab_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id),
  test_name VARCHAR(255) NOT NULL,
  result TEXT,
  notes TEXT,
  report_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patient allergies table
CREATE TABLE patient_allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  allergen VARCHAR(200) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  reaction TEXT,
  noted_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profile change history table
CREATE TABLE profile_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  ip_address INET,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX idx_patient_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX idx_nurses_user ON nurses(user_id);
CREATE INDEX idx_nurses_department ON nurses(department);
CREATE INDEX idx_pharmacists_user ON pharmacists(user_id);
CREATE INDEX idx_profile_change_history_patient ON profile_change_history(patient_id);
CREATE INDEX idx_profile_change_history_created ON profile_change_history(created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Enable Row-Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant table permissions to app role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medease_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO medease_app;
