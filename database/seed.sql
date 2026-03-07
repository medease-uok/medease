-- MedEase Database Seed Data
-- Run manually: npm run db:seed (from backend/)
-- Or directly: docker exec -i medease-db psql -U medease_user -d medease < database/seed.sql
--
-- All test passwords are hashed using pgcrypto: "Password@123"

BEGIN;

-- ============================================
-- USERS (all 6 roles)
-- ============================================

-- Admin
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@medease.com', crypt('Password@123', gen_salt('bf')), 'System', 'Admin', 'admin', '+94771000001', true),
  ('a0000000-0000-0000-0000-000000000002', 'nimali.admin@medease.com', crypt('Password@123', gen_salt('bf')), 'Nimali', 'Jayawardena', 'admin', '+94771000002', true);

-- Doctors
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'kamal.perera@medease.com', crypt('Password@123', gen_salt('bf')), 'Kamal', 'Perera', 'doctor', '+94772000001', '1980-05-14', true, 'default-images/58509043_9439678.jpg'),
  ('d0000000-0000-0000-0000-000000000002', 'sithara.silva@medease.com', crypt('Password@123', gen_salt('bf')), 'Sithara', 'Silva', 'doctor', '+94772000002', '1983-09-22', true, 'default-images/58509051_9439729.jpg'),
  ('d0000000-0000-0000-0000-000000000003', 'ruwan.fernando@medease.com', crypt('Password@123', gen_salt('bf')), 'Ruwan', 'Fernando', 'doctor', '+94772000003', '1986-01-10', true, 'default-images/58509054_9441186.jpg'),
  ('d0000000-0000-0000-0000-000000000004', 'anjali.dissanayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Anjali', 'Dissanayake', 'doctor', '+94772000004', '1988-11-03', true, 'default-images/58509055_9439726.jpg');

-- Nurses
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'malini.bandara@medease.com', crypt('Password@123', gen_salt('bf')), 'Malini', 'Bandara', 'nurse', '+94773000001', '1990-03-18', true, 'default-images/58509058_9442242.jpg'),
  ('e0000000-0000-0000-0000-000000000002', 'chamari.rathnayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Chamari', 'Rathnayake', 'nurse', '+94773000002', '1992-07-25', true, 'default-images/58509051_9439729.jpg'),
  ('e0000000-0000-0000-0000-000000000003', 'priyanka.kumari@medease.com', crypt('Password@123', gen_salt('bf')), 'Priyanka', 'Kumari', 'nurse', '+94773000003', '1994-12-05', true, 'default-images/58509055_9439726.jpg');

-- Lab Technicians
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('10000000-0000-0000-0000-000000000001', 'nimal.wijesinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Nimal', 'Wijesinghe', 'lab_technician', '+94774000001', '1987-06-20', true, 'default-images/58509057_9440461.jpg'),
  ('10000000-0000-0000-0000-000000000002', 'sanduni.herath@medease.com', crypt('Password@123', gen_salt('bf')), 'Sanduni', 'Herath', 'lab_technician', '+94774000002', '1993-04-11', true, 'default-images/58509058_9442242.jpg');

-- Pharmacists
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'tharindu.gamage@medease.com', crypt('Password@123', gen_salt('bf')), 'Tharindu', 'Gamage', 'pharmacist', '+94775000001', '1989-08-30', true, 'default-images/58509043_9439678.jpg'),
  ('b0000000-0000-0000-0000-000000000002', 'dilani.mendis@medease.com', crypt('Password@123', gen_salt('bf')), 'Dilani', 'Mendis', 'pharmacist', '+94775000002', '1991-02-14', true, 'default-images/58509055_9439726.jpg');

-- Patients (DOB is on the patients table for this role)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'sarah.fernando@medease.com', crypt('Password@123', gen_salt('bf')), 'Sarah', 'Fernando', 'patient', '+94776000001', true),
  ('c0000000-0000-0000-0000-000000000002', 'dinesh.rajapaksa@medease.com', crypt('Password@123', gen_salt('bf')), 'Dinesh', 'Rajapaksa', 'patient', '+94776000002', true),
  ('c0000000-0000-0000-0000-000000000003', 'kavindi.weerasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Kavindi', 'Weerasinghe', 'patient', '+94776000003', true),
  ('c0000000-0000-0000-0000-000000000004', 'nuwan.jayasuriya@medease.com', crypt('Password@123', gen_salt('bf')), 'Nuwan', 'Jayasuriya', 'patient', '+94776000004', true),
  ('c0000000-0000-0000-0000-000000000005', 'hasini.abeywickrama@medease.com', crypt('Password@123', gen_salt('bf')), 'Hasini', 'Abeywickrama', 'patient', '+94776000005', true),
  ('c0000000-0000-0000-0000-000000000006', 'lahiru.gunasekara@medease.com', crypt('Password@123', gen_salt('bf')), 'Lahiru', 'Gunasekara', 'patient', '+94776000006', true);

-- ============================================
-- DOCTORS (profiles)
-- ============================================

INSERT INTO doctors (id, user_id, specialization, license_number, department, available) VALUES
  ('dc000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Cardiology', 'SLMC-2015-4521', 'Cardiology', true),
  ('dc000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Neurology', 'SLMC-2016-7832', 'Neurology', true),
  ('dc000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Orthopedics', 'SLMC-2018-3294', 'Orthopedics', true),
  ('dc000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Pediatrics', 'SLMC-2019-5617', 'Pediatrics', false);

-- ============================================
-- PATIENTS (profiles)
-- ============================================

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_type, address, emergency_contact, emergency_relationship, emergency_phone, profile_image_url, insurance_provider, insurance_policy_number, insurance_plan_type, insurance_expiry_date) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1990-03-15', 'Female', 'O+', '45 Galle Road, Colombo 03', 'Amal Fernando', 'Spouse', '+94771234567', 'default-images/58509051_9439729.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2024-08932', 'Comprehensive', '2029-03-31'),
  ('ce000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '1985-07-22', 'Male', 'A+', '12 Kandy Road, Peradeniya', 'Kamala Rajapaksa', 'Parent', '+94772345678', 'default-images/58509043_9439678.jpg', 'Ceylinco Insurance', 'CEY-MED-2024-45210', 'Inpatient', '2028-12-31'),
  ('ce000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '1995-11-08', 'Female', 'B+', '78 Temple Road, Nugegoda', 'Sunil Weerasinghe', 'Parent', '+94773456789', 'default-images/58509055_9439726.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-71034', 'Comprehensive', '2029-06-30'),
  ('ce000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '1978-01-30', 'Male', 'AB-', '23 Lake Drive, Kurunegala', 'Priya Jayasuriya', 'Spouse', '+94774567890', 'default-images/58509054_9441186.jpg', NULL, NULL, NULL, NULL),
  ('ce000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '2000-06-12', 'Female', 'O-', '56 Beach Road, Matara', 'Kumari Abeywickrama', 'Parent', '+94775678901', 'default-images/58509058_9442242.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2025-33891', 'Outpatient', '2028-09-30'),
  ('ce000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '1992-09-25', 'Male', 'A-', '34 Hill Street, Galle', 'Nirmala Gunasekara', 'Sibling', '+94776789012', 'default-images/58509057_9440461.jpg', 'Union Assurance', 'UA-HEALTH-2024-12567', 'Inpatient', '2028-04-15');

-- ============================================
-- NURSES (profiles)
-- ============================================

INSERT INTO nurses (user_id, license_number, department) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'SLNC-2017-1001', 'Emergency'),
  ('e0000000-0000-0000-0000-000000000002', 'SLNC-2018-1002', 'ICU'),
  ('e0000000-0000-0000-0000-000000000003', 'SLNC-2019-1003', 'Surgery');

-- ============================================
-- PHARMACISTS (profiles)
-- ============================================

INSERT INTO pharmacists (user_id, license_number) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'SLPC-2020-2001'),
  ('b0000000-0000-0000-0000-000000000002', 'SLPC-2021-2002');

-- ============================================
-- APPOINTMENTS (mixed statuses)
-- ============================================

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, notes) VALUES
  -- Completed appointments (past)
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', 'completed', 'Routine cardiac checkup. ECG normal.'),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days', 'completed', 'Follow-up for recurring headaches. MRI ordered.'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', NOW() - INTERVAL '20 days', 'completed', 'Knee pain evaluation. X-ray taken.'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days', 'completed', 'Blood pressure monitoring. Medication adjusted.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days', 'completed', 'Neurological assessment. All clear.'),

  -- Confirmed appointments (upcoming)
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000001', NOW() + INTERVAL '2 days', 'confirmed', 'First cardiac consultation.'),
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003', NOW() + INTERVAL '3 days', 'confirmed', 'Sports injury follow-up.'),

  -- Scheduled appointments (upcoming)
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', NOW() + INTERVAL '5 days', 'scheduled', 'MRI results review.'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000004', NOW() + INTERVAL '7 days', 'scheduled', 'Pediatric referral for daughter.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', NOW() + INTERVAL '14 days', 'scheduled', 'Quarterly cardiac review.'),

  -- In-progress appointment
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002', NOW(), 'in_progress', 'Neurology consultation in progress.'),

  -- Cancelled appointment
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', NOW() - INTERVAL '5 days', 'cancelled', 'Patient requested cancellation.');

-- ============================================
-- MEDICAL RECORDS
-- ============================================

INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Mild hypertension (Stage 1)', 'Prescribed Amlodipine 5mg daily. Lifestyle modifications recommended.', 'Patient advised to reduce sodium intake, exercise 30 min/day. Follow-up in 3 months.'),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Tension-type headache', 'Prescribed Paracetamol 500mg as needed. Stress management recommended.', 'MRI brain normal. No neurological deficits. Likely stress-related.'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', 'Patellofemoral pain syndrome', 'Physical therapy 2x/week for 6 weeks. NSAIDs for pain management.', 'X-ray shows no fracture. Likely overuse injury. Avoid strenuous activity.'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', 'Atrial fibrillation', 'Prescribed Warfarin 5mg daily. Monthly INR monitoring required.', 'ECG confirmed AF. Echocardiogram shows normal ejection fraction. Referral to anticoagulation clinic.'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002', 'Peripheral neuropathy', 'Gabapentin 300mg twice daily. Vitamin B12 supplementation.', 'Nerve conduction study shows mild sensory neuropathy. HbA1c elevated - refer to endocrinology.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000002', 'Normal neurological examination', 'No treatment required.', 'Routine neurological screen. All reflexes normal. No further action needed.'),
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003', 'ACL sprain (Grade 2)', 'Knee brace, rest, ice. Physical therapy after 2 weeks.', 'Sports injury during cricket match. MRI confirms partial ACL tear. No surgery needed at this stage.'),
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Iron deficiency anemia', 'Ferrous sulfate 200mg twice daily. Dietary counseling provided.', 'Hemoglobin 9.2 g/dL. Serum ferritin low. Repeat CBC in 6 weeks.');

-- ============================================
-- PRESCRIPTIONS (mixed statuses)
-- ============================================

INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration, status) VALUES
  -- Active prescriptions
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Amlodipine', '5mg', 'Once daily (morning)', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', 'Warfarin', '5mg', 'Once daily (evening)', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002', 'Gabapentin', '300mg', 'Twice daily', '6 months', 'active'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002', 'Vitamin B12', '1000mcg', 'Once daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Ferrous Sulfate', '200mg', 'Twice daily (with meals)', '6 weeks', 'active'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', 'Ibuprofen', '400mg', 'Three times daily (after meals)', '2 weeks', 'active'),

  -- Dispensed prescriptions
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Paracetamol', '500mg', 'As needed (max 4x daily)', '1 month', 'dispensed'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Losartan', '50mg', 'Once daily', '3 months', 'dispensed'),

  -- Expired prescriptions
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003', 'Diclofenac Gel', '1% topical', 'Three times daily', '2 weeks', 'expired'),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Amitriptyline', '10mg', 'Once daily (bedtime)', '1 month', 'expired'),

  -- Cancelled prescription
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', 'Tramadol', '50mg', 'Twice daily', '1 week', 'cancelled');

-- ============================================
-- LAB REPORTS
-- ============================================

INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  ('ce000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Complete Blood Count (CBC)', 'WBC: 7.2 x10^9/L, RBC: 4.8 x10^12/L, Hemoglobin: 13.5 g/dL, Platelets: 250 x10^9/L', 'All values within normal range.', NOW() - INTERVAL '28 days'),
  ('ce000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Lipid Panel', 'Total Cholesterol: 210 mg/dL, LDL: 130 mg/dL, HDL: 55 mg/dL, Triglycerides: 150 mg/dL', 'LDL slightly elevated. Dietary modification recommended.', NOW() - INTERVAL '28 days'),
  ('ce000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'MRI Brain', 'No acute intracranial abnormality. No mass, hemorrhage, or midline shift.', 'Normal study. Report sent to Dr. Silva.', NOW() - INTERVAL '22 days'),
  ('ce000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'X-Ray Left Knee (AP/Lateral)', 'No fracture or dislocation. Mild soft tissue swelling noted. Joint spaces preserved.', 'Correlate clinically. No bony abnormality.', NOW() - INTERVAL '18 days'),
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'ECG (12-Lead)', 'Irregular rhythm. Atrial fibrillation with controlled ventricular rate (78 bpm). No ST changes.', 'AF confirmed. Recommend echocardiogram.', NOW() - INTERVAL '14 days'),
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'INR (Prothrombin Time)', 'INR: 2.3, PT: 26.5 seconds', 'Within therapeutic range (target 2.0-3.0). Continue current Warfarin dose.', NOW() - INTERVAL '7 days'),
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Nerve Conduction Study', 'Mild reduction in sensory nerve conduction velocity in bilateral lower limbs. Motor conduction normal.', 'Findings consistent with early sensory neuropathy.', NOW() - INTERVAL '12 days'),
  ('ce000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Complete Blood Count (CBC)', 'WBC: 6.8 x10^9/L, RBC: 3.9 x10^12/L, Hemoglobin: 9.2 g/dL, Platelets: 280 x10^9/L', 'Low hemoglobin indicates anemia. Recommend serum ferritin and iron studies.', NOW() - INTERVAL '10 days'),
  ('ce000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Serum Ferritin', 'Ferritin: 8 ng/mL (Normal: 12-150 ng/mL)', 'Low ferritin confirms iron deficiency. Treatment recommended.', NOW() - INTERVAL '9 days'),
  ('ce000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'MRI Left Knee', 'Partial tear of anterior cruciate ligament (Grade 2). Mild joint effusion. Menisci intact.', 'ACL partially torn. No meniscal damage. Conservative management may be appropriate.', NOW() - INTERVAL '5 days');

-- ============================================
-- PATIENT ALLERGIES
-- ============================================

INSERT INTO patient_allergies (patient_id, allergen, severity, reaction, noted_at) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'Penicillin', 'severe', 'Anaphylaxis — throat swelling, difficulty breathing', '2018-06-10'),
  ('ce000000-0000-0000-0000-000000000001', 'Shellfish', 'moderate', 'Hives and facial swelling', '2020-01-15'),
  ('ce000000-0000-0000-0000-000000000002', 'Aspirin', 'moderate', 'Gastrointestinal bleeding, stomach pain', '2019-03-22'),
  ('ce000000-0000-0000-0000-000000000003', 'Latex', 'mild', 'Contact dermatitis, skin redness', '2021-08-05'),
  ('ce000000-0000-0000-0000-000000000003', 'Pollen', 'mild', 'Sneezing, runny nose, watery eyes', '2015-04-01'),
  ('ce000000-0000-0000-0000-000000000004', 'Sulfonamides', 'severe', 'Stevens-Johnson syndrome risk — documented', '2017-11-20'),
  ('ce000000-0000-0000-0000-000000000004', 'Ibuprofen', 'moderate', 'Skin rash and mild bronchospasm', '2022-02-14'),
  ('ce000000-0000-0000-0000-000000000005', 'Peanuts', 'severe', 'Anaphylaxis — carries EpiPen', '2010-09-01'),
  ('ce000000-0000-0000-0000-000000000006', 'Codeine', 'mild', 'Nausea and mild itching', '2023-05-30');

-- ============================================
-- Mark all seeded users as email-verified (they are test accounts)
-- ============================================

UPDATE users SET email_verified = TRUE
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004',
  'e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006'
);

-- ============================================
-- AUDIT LOGS
-- ============================================

INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'LOGIN', 'session', NULL, '192.168.1.10', true),
  ('d0000000-0000-0000-0000-000000000001', 'LOGIN', 'session', NULL, '192.168.1.20', true),
  ('d0000000-0000-0000-0000-000000000001', 'VIEW', 'patient', 'ce000000-0000-0000-0000-000000000001', '192.168.1.20', true),
  ('d0000000-0000-0000-0000-000000000001', 'CREATE', 'medical_record', NULL, '192.168.1.20', true),
  ('d0000000-0000-0000-0000-000000000001', 'CREATE', 'prescription', NULL, '192.168.1.20', true),
  ('d0000000-0000-0000-0000-000000000002', 'LOGIN', 'session', NULL, '192.168.1.21', true),
  ('d0000000-0000-0000-0000-000000000002', 'VIEW', 'patient', 'ce000000-0000-0000-0000-000000000002', '192.168.1.21', true),
  ('10000000-0000-0000-0000-000000000001', 'LOGIN', 'session', NULL, '192.168.1.30', true),
  ('10000000-0000-0000-0000-000000000001', 'CREATE', 'lab_report', NULL, '192.168.1.30', true),
  ('b0000000-0000-0000-0000-000000000001', 'LOGIN', 'session', NULL, '192.168.1.40', true),
  ('b0000000-0000-0000-0000-000000000001', 'UPDATE', 'prescription', NULL, '192.168.1.40', true),
  ('c0000000-0000-0000-0000-000000000001', 'LOGIN', 'session', NULL, '10.0.0.50', true),
  ('c0000000-0000-0000-0000-000000000001', 'VIEW', 'appointment', NULL, '10.0.0.50', true),
  ('c0000000-0000-0000-0000-000000000003', 'LOGIN', 'session', NULL, '10.0.0.51', false),
  ('a0000000-0000-0000-0000-000000000001', 'UPDATE', 'user', 'd0000000-0000-0000-0000-000000000004', '192.168.1.10', true);

COMMIT;
