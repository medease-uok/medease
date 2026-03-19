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

INSERT INTO doctors (id, user_id, specialization, license_number, department, available, gender) VALUES
  ('dc000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Cardiology', 'SLMC-2015-4521', 'Cardiology', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Neurology', 'SLMC-2016-7832', 'Neurology', true, 'Female'),
  ('dc000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Orthopedics', 'SLMC-2018-3294', 'Orthopedics', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Pediatrics', 'SLMC-2019-5617', 'Pediatrics', false, 'Female');

-- ============================================
-- PATIENTS (profiles)
-- ============================================

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_type, organ_donor, organ_donor_card_no, organs_to_donate, address, emergency_contact, emergency_relationship, emergency_phone, profile_image_url, insurance_provider, insurance_policy_number, insurance_plan_type, insurance_expiry_date) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1990-03-15', 'Female', 'O+', true, 'NTP-2023-08451', ARRAY['Kidneys','Liver','Eyes'], '45 Galle Road, Colombo 03', 'Amal Fernando', 'Spouse', '+94771234567', 'default-images/58509051_9439729.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2024-08932', 'Comprehensive', '2029-03-31'),
  ('ce000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '1985-07-22', 'Male', 'A+', false, NULL, NULL, '12 Kandy Road, Peradeniya', 'Kamala Rajapaksa', 'Parent', '+94772345678', 'default-images/58509043_9439678.jpg', 'Ceylinco Insurance', 'CEY-MED-2024-45210', 'Inpatient', '2028-12-31'),
  ('ce000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '1995-11-08', 'Female', 'B+', true, 'NTP-2024-12930', ARRAY['Eyes','Heart','Lungs','Kidneys'], '78 Temple Road, Nugegoda', 'Sunil Weerasinghe', 'Parent', '+94773456789', 'default-images/58509055_9439726.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-71034', 'Comprehensive', '2029-06-30'),
  ('ce000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '1978-01-30', 'Male', 'AB-', false, NULL, NULL, '23 Lake Drive, Kurunegala', 'Priya Jayasuriya', 'Spouse', '+94774567890', 'default-images/58509054_9441186.jpg', NULL, NULL, NULL, NULL),
  ('ce000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '2000-06-12', 'Female', 'O-', true, 'NTP-2025-03217', ARRAY['Kidneys','Liver','Pancreas','Skin'], '56 Beach Road, Matara', 'Kumari Abeywickrama', 'Parent', '+94775678901', 'default-images/58509058_9442242.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2025-33891', 'Outpatient', '2028-09-30'),
  ('ce000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '1992-09-25', 'Male', 'A-', false, NULL, NULL, '34 Hill Street, Galle', 'Nirmala Gunasekara', 'Sibling', '+94776789012', 'default-images/58509057_9440461.jpg', 'Union Assurance', 'UA-HEALTH-2024-12567', 'Inpatient', '2028-04-15');

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
  -- Completed appointments (past, with specific clinic hours)
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '30 days') + TIME '09:00', 'completed', 'Routine cardiac checkup. ECG normal.'),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE - INTERVAL '25 days') + TIME '10:30', 'completed', 'Follow-up for recurring headaches. MRI ordered.'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', (CURRENT_DATE - INTERVAL '20 days') + TIME '14:00', 'completed', 'Knee pain evaluation. X-ray taken.'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '15 days') + TIME '11:15', 'completed', 'Blood pressure monitoring. Medication adjusted.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE - INTERVAL '10 days') + TIME '15:30', 'completed', 'Neurological assessment. All clear.'),

  -- Confirmed appointments (upcoming, with specific clinic hours)
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '2 days') + TIME '09:30', 'confirmed', 'First cardiac consultation.'),
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003', (CURRENT_DATE + INTERVAL '3 days') + TIME '14:00', 'confirmed', 'Sports injury follow-up.'),

  -- Scheduled appointments (upcoming, with specific clinic hours)
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE + INTERVAL '5 days') + TIME '10:00', 'scheduled', 'MRI results review.'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000004', (CURRENT_DATE + INTERVAL '7 days') + TIME '11:00', 'scheduled', 'Pediatric referral for daughter.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '14 days') + TIME '09:00', 'scheduled', 'Quarterly cardiac review.'),

  -- Today's appointments (with specific times)
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002', CURRENT_DATE + TIME '08:30', 'completed', 'Morning neurology consultation completed.'),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000001', CURRENT_DATE + TIME '10:00', 'in_progress', 'Cardiology follow-up in progress.'),
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000002', CURRENT_DATE + TIME '13:00', 'scheduled', 'Afternoon neurology appointment.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000003', CURRENT_DATE + TIME '15:30', 'scheduled', 'Orthopedic consultation.'),

  -- Cancelled appointment
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', (CURRENT_DATE - INTERVAL '5 days') + TIME '16:00', 'cancelled', 'Patient requested cancellation.');

-- ============================================
-- MEDICAL RECORDS
-- ============================================

INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Mild hypertension (Stage 1)', 'Lifestyle modifications: reduce sodium intake, increase potassium-rich foods. Exercise 30 min/day, 5 days/week. Monitor BP daily at home. Follow-up in 3 months.', 'BP reading 142/92 mmHg. No signs of end-organ damage. BMI 27.3 — weight management recommended.'),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Tension-type headache', 'Stress management: regular sleep schedule, relaxation techniques. Limit screen time to 8 hours. Ergonomic workspace assessment recommended. Keep headache diary.', 'MRI brain normal. No neurological deficits. Likely stress-related. Triggers: poor sleep, prolonged screen use.'),
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', 'Patellofemoral pain syndrome', 'Physical therapy 2x/week for 6 weeks. RICE protocol (Rest, Ice, Compression, Elevation). Avoid strenuous activity and deep squats. Gradually return to normal activity after 4 weeks.', 'X-ray shows no fracture. Likely overuse injury from athletics. Crepitus noted on knee flexion.'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', 'Atrial fibrillation', 'Monthly INR monitoring required (target 2.0-3.0). Referral to anticoagulation clinic. Avoid excessive alcohol and caffeine. Regular cardiac follow-up every 2 months.', 'ECG confirmed AF with controlled ventricular rate. Echocardiogram shows normal ejection fraction (55%). CHA2DS2-VASc score: 2.'),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002', 'Peripheral neuropathy', 'Refer to endocrinology for diabetes management. Annual nerve conduction study. Foot care education: daily inspection, proper footwear. Report any new numbness or tingling.', 'Nerve conduction study shows mild sensory neuropathy in bilateral lower limbs. HbA1c 7.8% — glycemic control needs improvement.'),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000002', 'Normal neurological examination', 'No treatment required. Annual neurological screen recommended. Continue current health maintenance.', 'Routine neurological screen. All cranial nerves intact. Reflexes normal. No focal deficits. Motor and sensory examination normal.'),
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003', 'ACL sprain (Grade 2)', 'Knee brace for 4-6 weeks. RICE protocol. Physical therapy starting after 2 weeks. Avoid contact sports for 3 months. Gradual return to cricket with protective gear.', 'Sports injury during cricket match. MRI confirms partial ACL tear. No meniscal damage. Conservative management appropriate — surgery not indicated at this stage.'),
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Iron deficiency anemia', 'Dietary counseling: increase iron-rich foods (spinach, lentils, red meat). Take iron with vitamin C for better absorption. Avoid tea/coffee with meals. Repeat CBC in 6 weeks.', 'Hemoglobin 9.2 g/dL. Serum ferritin 8 ng/mL. MCV 72 fL (microcytic). No signs of GI bleeding. Menstrual history — heavy periods reported.');

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
  ('ce000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Complete Blood Count (CBC)', 'WBC: 7.2 x10^9/L, RBC: 4.8 x10^12/L, Hemoglobin: 13.5 g/dL, Platelets: 250 x10^9/L', 'All values within normal range.', (CURRENT_DATE - INTERVAL '28 days') + TIME '08:45'),
  ('ce000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Lipid Panel', 'Total Cholesterol: 210 mg/dL, LDL: 130 mg/dL, HDL: 55 mg/dL, Triglycerides: 150 mg/dL', 'LDL slightly elevated. Dietary modification recommended.', (CURRENT_DATE - INTERVAL '28 days') + TIME '09:30'),
  ('ce000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'MRI Brain', 'No acute intracranial abnormality. No mass, hemorrhage, or midline shift.', 'Normal study. Report sent to Dr. Silva.', (CURRENT_DATE - INTERVAL '22 days') + TIME '11:00'),
  ('ce000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'X-Ray Left Knee (AP/Lateral)', 'No fracture or dislocation. Mild soft tissue swelling noted. Joint spaces preserved.', 'Correlate clinically. No bony abnormality.', (CURRENT_DATE - INTERVAL '18 days') + TIME '14:15'),
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'ECG (12-Lead)', 'Irregular rhythm. Atrial fibrillation with controlled ventricular rate (78 bpm). No ST changes.', 'AF confirmed. Recommend echocardiogram.', (CURRENT_DATE - INTERVAL '14 days') + TIME '10:00'),
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'INR (Prothrombin Time)', 'INR: 2.3, PT: 26.5 seconds', 'Within therapeutic range (target 2.0-3.0). Continue current Warfarin dose.', (CURRENT_DATE - INTERVAL '7 days') + TIME '08:30'),
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Nerve Conduction Study', 'Mild reduction in sensory nerve conduction velocity in bilateral lower limbs. Motor conduction normal.', 'Findings consistent with early sensory neuropathy.', (CURRENT_DATE - INTERVAL '12 days') + TIME '15:00'),
  ('ce000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Complete Blood Count (CBC)', 'WBC: 6.8 x10^9/L, RBC: 3.9 x10^12/L, Hemoglobin: 9.2 g/dL, Platelets: 280 x10^9/L', 'Low hemoglobin indicates anemia. Recommend serum ferritin and iron studies.', (CURRENT_DATE - INTERVAL '10 days') + TIME '09:15'),
  ('ce000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Serum Ferritin', 'Ferritin: 8 ng/mL (Normal: 12-150 ng/mL)', 'Low ferritin confirms iron deficiency. Treatment recommended.', (CURRENT_DATE - INTERVAL '9 days') + TIME '10:45'),
  ('ce000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'MRI Left Knee', 'Partial tear of anterior cruciate ligament (Grade 2). Mild joint effusion. Menisci intact.', 'ACL partially torn. No meniscal damage. Conservative management may be appropriate.', (CURRENT_DATE - INTERVAL '5 days') + TIME '13:30');

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
-- PRESCRIPTION REFILL REQUESTS
-- ============================================

INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, doctor_note, responded_at, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'approved',
       'Running low on medication, need a refill.',
       'Approved. Continue same dosage.',
       NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days'
FROM prescriptions rx
WHERE rx.medication = 'Amlodipine' AND rx.status = 'active'
LIMIT 1;

INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, doctor_note, responded_at, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'denied',
       'Would like to continue this medication.',
       'Denied. Please schedule an appointment for re-evaluation.',
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'
FROM prescriptions rx
WHERE rx.medication = 'Ibuprofen' AND rx.status = 'active'
LIMIT 1;

INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'pending',
       'Almost out of medication. Please refill.',
       NOW() - INTERVAL '12 hours'
FROM prescriptions rx
WHERE rx.medication = 'Warfarin' AND rx.status = 'active'
LIMIT 1;

INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'pending',
       'Need to continue iron supplementation as recommended.',
       NOW() - INTERVAL '6 hours'
FROM prescriptions rx
WHERE rx.medication = 'Ferrous Sulfate' AND rx.status = 'active'
LIMIT 1;

-- ============================================
-- Mark all seeded users as email-verified
-- ============================================

UPDATE users SET email_verified = TRUE WHERE email LIKE '%@medease.com';

-- ============================================
-- NOTIFICATIONS (sample notifications for seeded users)
-- ============================================

INSERT INTO notifications (recipient_id, type, title, message, is_read, reference_id, reference_type, created_at) VALUES
  -- Patient Sarah Fernando: appointment and medical record notifications
  ('c0000000-0000-0000-0000-000000000001', 'appointment_scheduled', 'Appointment Scheduled', 'Your appointment with Dr. Kamal Perera has been scheduled.', true, NULL, 'appointment', NOW() - INTERVAL '31 days'),
  ('c0000000-0000-0000-0000-000000000001', 'appointment_confirmed', 'Appointment Confirmed', 'Your appointment with Dr. Kamal Perera has been confirmed.', true, NULL, 'appointment', NOW() - INTERVAL '30 days'),
  ('c0000000-0000-0000-0000-000000000001', 'medical_record_created', 'New Medical Record', 'Dr. Kamal Perera added a new record: Mild hypertension (Stage 1).', true, NULL, 'medical_record', NOW() - INTERVAL '29 days'),
  ('c0000000-0000-0000-0000-000000000001', 'prescription_created', 'New Prescription', 'Dr. Kamal Perera prescribed Amlodipine 5mg.', true, NULL, 'prescription', NOW() - INTERVAL '29 days'),
  ('c0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'Your Complete Blood Count (CBC) results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '28 days'),
  ('c0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'Your Lipid Panel results are now available.', false, NULL, 'lab_report', NOW() - INTERVAL '28 days'),
  ('c0000000-0000-0000-0000-000000000001', 'appointment_scheduled', 'Appointment Scheduled', 'Your quarterly cardiac review with Dr. Kamal Perera has been scheduled.', false, NULL, 'appointment', NOW() - INTERVAL '2 days'),
  ('c0000000-0000-0000-0000-000000000001', 'refill_approved', 'Refill Approved', 'Your refill request for Amlodipine has been approved.', true, NULL, 'refill_request', NOW() - INTERVAL '15 days'),

  -- Patient Dinesh Rajapaksa: neurology notifications
  ('c0000000-0000-0000-0000-000000000002', 'appointment_confirmed', 'Appointment Confirmed', 'Your appointment with Dr. Sithara Silva has been confirmed.', true, NULL, 'appointment', NOW() - INTERVAL '26 days'),
  ('c0000000-0000-0000-0000-000000000002', 'medical_record_created', 'New Medical Record', 'Dr. Sithara Silva added a new record: Tension-type headache.', true, NULL, 'medical_record', NOW() - INTERVAL '24 days'),
  ('c0000000-0000-0000-0000-000000000002', 'lab_report_ready', 'Lab Report Ready', 'Your MRI Brain results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '22 days'),
  ('c0000000-0000-0000-0000-000000000002', 'prescription_dispensed', 'Prescription Dispensed', 'Your Paracetamol 500mg prescription has been dispensed.', false, NULL, 'prescription', NOW() - INTERVAL '20 days'),
  ('c0000000-0000-0000-0000-000000000002', 'appointment_scheduled', 'Appointment Scheduled', 'Your MRI results review with Dr. Sithara Silva has been scheduled.', false, NULL, 'appointment', NOW() - INTERVAL '3 days'),

  -- Patient Kavindi Weerasinghe: orthopedics notifications
  ('c0000000-0000-0000-0000-000000000003', 'lab_report_ready', 'Lab Report Ready', 'Your X-Ray Left Knee results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '18 days'),
  ('c0000000-0000-0000-0000-000000000003', 'prescription_created', 'New Prescription', 'Dr. Ruwan Fernando prescribed Ibuprofen 400mg.', false, NULL, 'prescription', NOW() - INTERVAL '18 days'),
  ('c0000000-0000-0000-0000-000000000003', 'refill_denied', 'Refill Denied', 'Your refill request for Ibuprofen has been denied.', false, NULL, 'refill_request', NOW() - INTERVAL '10 days'),

  -- Patient Nuwan Jayasuriya: cardiac + neurology notifications
  ('c0000000-0000-0000-0000-000000000004', 'medical_record_created', 'New Medical Record', 'Dr. Kamal Perera added a new record: Atrial fibrillation.', true, NULL, 'medical_record', NOW() - INTERVAL '14 days'),
  ('c0000000-0000-0000-0000-000000000004', 'lab_report_ready', 'Lab Report Ready', 'Your ECG (12-Lead) results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '14 days'),
  ('c0000000-0000-0000-0000-000000000004', 'prescription_created', 'New Prescription', 'Dr. Kamal Perera prescribed Warfarin 5mg.', true, NULL, 'prescription', NOW() - INTERVAL '13 days'),
  ('c0000000-0000-0000-0000-000000000004', 'lab_report_ready', 'Lab Results Updated', 'Your INR (Prothrombin Time) results are now available.', false, NULL, 'lab_report', NOW() - INTERVAL '7 days'),
  ('c0000000-0000-0000-0000-000000000004', 'prescription_created', 'New Prescription', 'Dr. Sithara Silva prescribed Gabapentin 300mg.', false, NULL, 'prescription', NOW() - INTERVAL '11 days'),

  -- Patient Hasini Abeywickrama: anemia notifications
  ('c0000000-0000-0000-0000-000000000005', 'lab_report_ready', 'Lab Report Ready', 'Your Complete Blood Count (CBC) results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '10 days'),
  ('c0000000-0000-0000-0000-000000000005', 'lab_report_ready', 'Lab Report Ready', 'Your Serum Ferritin results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '9 days'),
  ('c0000000-0000-0000-0000-000000000005', 'medical_record_created', 'New Medical Record', 'Dr. Anjali Dissanayake added a new record: Iron deficiency anemia.', false, NULL, 'medical_record', NOW() - INTERVAL '8 days'),
  ('c0000000-0000-0000-0000-000000000005', 'prescription_created', 'New Prescription', 'Dr. Anjali Dissanayake prescribed Ferrous Sulfate 200mg.', false, NULL, 'prescription', NOW() - INTERVAL '8 days'),
  ('c0000000-0000-0000-0000-000000000005', 'appointment_confirmed', 'Appointment Confirmed', 'Your appointment with Dr. Kamal Perera has been confirmed.', false, NULL, 'appointment', NOW() - INTERVAL '1 day'),
  ('c0000000-0000-0000-0000-000000000005', 'appointment_cancelled', 'Appointment Cancelled', 'Your appointment with Dr. Anjali Dissanayake has been cancelled.', true, NULL, 'appointment', NOW() - INTERVAL '5 days'),

  -- Patient Lahiru Gunasekara: sports injury notifications
  ('c0000000-0000-0000-0000-000000000006', 'lab_report_ready', 'Lab Report Ready', 'Your MRI Left Knee results are now available.', false, NULL, 'lab_report', NOW() - INTERVAL '5 days'),
  ('c0000000-0000-0000-0000-000000000006', 'medical_record_created', 'New Medical Record', 'Dr. Ruwan Fernando added a new record: ACL sprain (Grade 2).', false, NULL, 'medical_record', NOW() - INTERVAL '4 days'),
  ('c0000000-0000-0000-0000-000000000006', 'appointment_confirmed', 'Appointment Confirmed', 'Your follow-up with Dr. Ruwan Fernando has been confirmed.', false, NULL, 'appointment', NOW() - INTERVAL '1 day'),

  -- Doctor Kamal Perera: lab report + refill notifications
  ('d0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'CBC results for Sarah Fernando are available.', true, NULL, 'lab_report', NOW() - INTERVAL '28 days'),
  ('d0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'Lipid Panel results for Sarah Fernando are available.', true, NULL, 'lab_report', NOW() - INTERVAL '28 days'),
  ('d0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'ECG results for Nuwan Jayasuriya are available.', true, NULL, 'lab_report', NOW() - INTERVAL '14 days'),
  ('d0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Results Updated', 'INR results for Nuwan Jayasuriya are available.', false, NULL, 'lab_report', NOW() - INTERVAL '7 days'),
  ('d0000000-0000-0000-0000-000000000001', 'appointment_scheduled', 'New Appointment', 'Hasini Abeywickrama has scheduled an appointment.', false, NULL, 'appointment', NOW() - INTERVAL '3 days'),
  ('d0000000-0000-0000-0000-000000000001', 'refill_requested', 'Refill Request', 'Sarah Fernando requested a refill for Amlodipine (5mg).', false, NULL, 'refill_request', NOW() - INTERVAL '5 hours'),

  -- Doctor Sithara Silva: notifications
  ('d0000000-0000-0000-0000-000000000002', 'lab_report_ready', 'Lab Report Ready', 'MRI Brain results for Dinesh Rajapaksa are available.', true, NULL, 'lab_report', NOW() - INTERVAL '22 days'),
  ('d0000000-0000-0000-0000-000000000002', 'lab_report_ready', 'Lab Report Ready', 'Nerve Conduction Study results for Nuwan Jayasuriya are available.', false, NULL, 'lab_report', NOW() - INTERVAL '12 days'),

  -- Doctor Ruwan Fernando: notifications
  ('d0000000-0000-0000-0000-000000000003', 'lab_report_ready', 'Lab Report Ready', 'X-Ray results for Kavindi Weerasinghe are available.', true, NULL, 'lab_report', NOW() - INTERVAL '18 days'),
  ('d0000000-0000-0000-0000-000000000003', 'lab_report_ready', 'Lab Report Ready', 'MRI Left Knee results for Lahiru Gunasekara are available.', false, NULL, 'lab_report', NOW() - INTERVAL '5 days'),
  ('d0000000-0000-0000-0000-000000000003', 'appointment_scheduled', 'New Appointment', 'Lahiru Gunasekara has scheduled a follow-up appointment.', false, NULL, 'appointment', NOW() - INTERVAL '2 days'),
  ('d0000000-0000-0000-0000-000000000003', 'refill_requested', 'Refill Request', 'Kavindi Weerasinghe requested a refill for Ibuprofen (400mg).', false, NULL, 'refill_request', NOW() - INTERVAL '1 day'),

  -- Pharmacist Tharindu Gamage: system notification
  ('b0000000-0000-0000-0000-000000000001', 'system', 'System Update', 'Pharmacy inventory module has been updated.', false, NULL, NULL, NOW() - INTERVAL '1 day'),

  -- Admin: system notifications
  ('a0000000-0000-0000-0000-000000000001', 'system', 'System Update', 'Database backup completed successfully.', true, NULL, NULL, NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'system', 'New User Registration', 'A new user has registered and is pending approval.', false, NULL, NULL, NOW() - INTERVAL '6 hours');

-- ============================================
-- MEDICAL DOCUMENTS (sample records)
-- ============================================
-- Note: file_key values are placeholders. Actual S3 keys would be generated on upload.
INSERT INTO medical_documents (patient_id, uploaded_by, category, title, description, file_key, file_name, file_size, mime_type, created_at) VALUES
  -- Sarah Fernando's documents
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'lab_report',
   'Complete Blood Count - Feb 2026', 'Routine CBC test results showing normal ranges.',
   'medical-documents/ce000000-0000-0000-0000-000000000001/seed-cbc-report.pdf',
   'CBC_Report_Feb2026.pdf', 245760, 'application/pdf', NOW() - INTERVAL '30 days'),

  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'imaging',
   'Chest X-Ray', 'Follow-up chest X-ray. No abnormalities detected.',
   'medical-documents/ce000000-0000-0000-0000-000000000001/seed-chest-xray.jpg',
   'Chest_XRay_Jan2026.jpg', 1048576, 'image/jpeg', NOW() - INTERVAL '45 days'),

  -- Dinesh Rajapaksa's documents
  ('ce000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'clinical_note',
   'Neurology Consultation Notes', 'Initial consultation notes for recurring headaches.',
   'medical-documents/ce000000-0000-0000-0000-000000000002/seed-neuro-notes.pdf',
   'Neurology_Consultation.pdf', 153600, 'application/pdf', NOW() - INTERVAL '25 days'),

  ('ce000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'lab_report',
   'MRI Brain Scan Report', 'MRI results with radiologist findings.',
   'medical-documents/ce000000-0000-0000-0000-000000000002/seed-mri-brain.pdf',
   'MRI_Brain_Report.pdf', 512000, 'application/pdf', NOW() - INTERVAL '20 days'),

  -- Kavindi Weerasinghe's documents
  ('ce000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'discharge_summary',
   'Discharge Summary - Knee Surgery', 'Post-operative discharge summary and recovery instructions.',
   'medical-documents/ce000000-0000-0000-0000-000000000003/seed-discharge.pdf',
   'Discharge_Summary_KneeSurgery.pdf', 307200, 'application/pdf', NOW() - INTERVAL '15 days'),

  ('ce000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'insurance',
   'Insurance Claim Form', 'Health insurance claim for knee surgery.',
   'medical-documents/ce000000-0000-0000-0000-000000000003/seed-insurance-claim.pdf',
   'Insurance_Claim_2026.pdf', 204800, 'application/pdf', NOW() - INTERVAL '10 days'),

  -- Nuwan Jayasuriya's documents
  ('ce000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'lab_report',
   'ECG Report', 'Electrocardiogram results from routine cardiac checkup.',
   'medical-documents/ce000000-0000-0000-0000-000000000004/seed-ecg-report.pdf',
   'ECG_Report_Mar2026.pdf', 184320, 'application/pdf', NOW() - INTERVAL '8 days'),

  -- Hasini Abeywickrama's documents
  ('ce000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'referral',
   'Dermatology Referral', 'Referral letter for dermatology consultation.',
   'medical-documents/ce000000-0000-0000-0000-000000000005/seed-derm-referral.pdf',
   'Dermatology_Referral.pdf', 102400, 'application/pdf', NOW() - INTERVAL '5 days'),

  -- Sarah Fernando — additional document categories
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'medical_record',
   'Hypertension Diagnosis Notes', 'Scanned clinical notes from Stage 1 hypertension diagnosis.',
   'medical-documents/ce000000-0000-0000-0000-000000000001/seed-hypertension-notes.pdf',
   'Hypertension_Diagnosis_Notes.pdf', 198000, 'application/pdf', NOW() - INTERVAL '2 days'),
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'prescription',
   'Amlodipine Prescription Scan', 'Scanned prescription for Amlodipine 5mg daily.',
   'medical-documents/ce000000-0000-0000-0000-000000000001/seed-amlodipine-rx.jpg',
   'Amlodipine_Prescription.jpg', 350000, 'image/jpeg', NOW() - INTERVAL '2 days');

-- ============================================
-- VACCINATIONS (immunization history)
-- ============================================
INSERT INTO vaccinations (patient_id, administered_by, vaccine_name, dose_number, lot_number, manufacturer, site, scheduled_date, administered_date, next_dose_date, status, notes, created_at) VALUES
  -- Sarah Fernando
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Hepatitis B', 1, 'HB2025-A1', 'GSK', 'Left deltoid', '2025-06-10', '2025-06-10', '2025-07-10', 'completed', 'First dose administered without adverse effects.', NOW() - INTERVAL '270 days'),
  ('ce000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Hepatitis B', 2, 'HB2025-A2', 'GSK', 'Left deltoid', '2025-07-10', '2025-07-12', '2025-12-10', 'completed', 'Second dose. Mild soreness at injection site.', NOW() - INTERVAL '240 days'),
  ('ce000000-0000-0000-0000-000000000001', NULL, 'Hepatitis B', 3, NULL, 'GSK', NULL, '2025-12-10', NULL, NULL, 'missed', 'Patient did not attend scheduled appointment.', NOW() - INTERVAL '90 days'),
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Influenza (Seasonal)', 1, 'FLU2026-01', 'Seqirus', 'Right deltoid', '2026-01-15', '2026-01-15', NULL, 'completed', 'Annual flu shot.', NOW() - INTERVAL '55 days'),

  -- Dinesh Rajapaksa
  ('ce000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'COVID-19 (Pfizer)', 1, 'PF2025-C1', 'Pfizer-BioNTech', 'Left deltoid', '2025-08-01', '2025-08-01', '2025-08-22', 'completed', 'No adverse reactions.', NOW() - INTERVAL '220 days'),
  ('ce000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'COVID-19 (Pfizer)', 2, 'PF2025-C2', 'Pfizer-BioNTech', 'Left deltoid', '2025-08-22', '2025-08-22', NULL, 'completed', 'Mild fatigue for 24 hours.', NOW() - INTERVAL '200 days'),
  ('ce000000-0000-0000-0000-000000000002', NULL, 'Tetanus Booster', 1, NULL, NULL, NULL, '2026-04-01', NULL, NULL, 'scheduled', 'Due for decennial tetanus booster.', NOW() - INTERVAL '5 days'),

  -- Kavindi Weerasinghe
  ('ce000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Influenza (Seasonal)', 1, 'FLU2026-02', 'Seqirus', 'Right deltoid', '2026-02-01', '2026-02-01', NULL, 'completed', 'Annual flu vaccination.', NOW() - INTERVAL '38 days'),
  ('ce000000-0000-0000-0000-000000000003', NULL, 'Pneumococcal (PCV13)', 1, NULL, 'Pfizer', NULL, '2026-03-20', NULL, NULL, 'scheduled', 'Recommended due to surgical history.', NOW() - INTERVAL '2 days'),

  -- Nuwan Jayasuriya
  ('ce000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'COVID-19 (AstraZeneca)', 1, 'AZ2025-01', 'AstraZeneca', 'Left deltoid', '2025-05-10', '2025-05-10', '2025-07-10', 'completed', 'First dose.', NOW() - INTERVAL '300 days'),
  ('ce000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'COVID-19 (AstraZeneca)', 2, 'AZ2025-02', 'AstraZeneca', 'Left deltoid', '2025-07-10', '2025-07-10', NULL, 'completed', 'Second dose. Mild fever for 48 hours.', NOW() - INTERVAL '240 days'),

  -- Hasini Abeywickrama
  ('ce000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'HPV (Gardasil 9)', 1, 'HPV2025-G1', 'Merck', 'Left deltoid', '2025-09-01', '2025-09-01', '2025-11-01', 'completed', 'First dose of 3-dose series.', NOW() - INTERVAL '190 days'),
  ('ce000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'HPV (Gardasil 9)', 2, 'HPV2025-G2', 'Merck', 'Left deltoid', '2025-11-01', '2025-11-03', '2026-03-01', 'completed', 'Second dose. Slight swelling at site.', NOW() - INTERVAL '128 days'),
  ('ce000000-0000-0000-0000-000000000005', NULL, 'HPV (Gardasil 9)', 3, NULL, 'Merck', NULL, '2026-03-01', NULL, NULL, 'scheduled', 'Third and final dose pending.', NOW() - INTERVAL '10 days'),

  -- Lahiru Gunasekara
  ('ce000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', 'Tetanus (Td)', 1, 'TD2026-01', 'Sanofi', 'Right deltoid', '2026-02-15', '2026-02-15', NULL, 'completed', 'Booster after sports injury.', NOW() - INTERVAL '24 days');

-- ============================================
-- CHRONIC CONDITIONS
-- ============================================
INSERT INTO chronic_conditions (patient_id, diagnosed_by, condition_name, severity, diagnosed_date, resolved_date, treatment, medications, status, notes, created_at) VALUES
  -- Sarah Fernando
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Asthma', 'moderate', '2018-03-15', NULL, 'Inhaler therapy, avoid triggers', 'Salbutamol 100mcg inhaler PRN, Fluticasone 250mcg BD', 'managed', 'Well controlled with current medications. Annual review recommended.', NOW() - INTERVAL '200 days'),
  ('ce000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Seasonal Allergic Rhinitis', 'mild', '2020-06-10', NULL, 'Antihistamines during pollen season', 'Cetirizine 10mg OD (seasonal)', 'monitoring', 'Symptoms mainly March-May. Consider immunotherapy if worsening.', NOW() - INTERVAL '150 days'),

  -- Dinesh Rajapaksa
  ('ce000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Type 2 Diabetes Mellitus', 'moderate', '2019-07-22', NULL, 'Diet control, exercise, oral hypoglycemics', 'Metformin 500mg BD, Gliclazide 80mg OD', 'active', 'HbA1c 7.2% at last check. Target <7%. Quarterly monitoring.', NOW() - INTERVAL '300 days'),
  ('ce000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Essential Hypertension', 'moderate', '2020-01-10', NULL, 'Lifestyle modifications, antihypertensives', 'Amlodipine 5mg OD, Losartan 50mg OD', 'active', 'BP well controlled at 130/80. Continue current regimen.', NOW() - INTERVAL '280 days'),
  ('ce000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Hyperlipidemia', 'mild', '2020-03-15', NULL, 'Dietary modifications, statin therapy', 'Atorvastatin 20mg nocte', 'managed', 'LDL reduced to 2.5 mmol/L. Continue statin.', NOW() - INTERVAL '250 days'),

  -- Kavindi Weerasinghe
  ('ce000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Iron Deficiency Anemia', 'mild', '2025-08-01', NULL, 'Iron supplementation, dietary changes', 'Ferrous sulfate 200mg TDS', 'active', 'Hb improving from 9.5 to 10.8 g/dL. Recheck in 3 months.', NOW() - INTERVAL '100 days'),

  -- Nuwan Jayasuriya
  ('ce000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Chronic Low Back Pain', 'moderate', '2022-04-10', NULL, 'Physiotherapy, pain management', 'Naproxen 500mg BD PRN, Omeprazole 20mg OD', 'active', 'MRI shows L4-L5 disc protrusion. Physio sessions twice weekly.', NOW() - INTERVAL '350 days'),
  ('ce000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Gastroesophageal Reflux Disease', 'mild', '2023-09-15', '2025-06-01', 'PPI therapy, dietary modifications', 'Omeprazole 20mg OD (already prescribed)', 'resolved', 'Symptoms resolved after 6 months of PPI. Discontinued specific GERD treatment.', NOW() - INTERVAL '200 days'),

  -- Hasini Abeywickrama
  ('ce000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'Migraine without Aura', 'moderate', '2021-11-20', NULL, 'Trigger avoidance, abortive therapy', 'Sumatriptan 50mg PRN, Propranolol 40mg BD (prophylaxis)', 'active', 'Frequency reduced from 4/month to 1/month with prophylaxis.', NOW() - INTERVAL '180 days'),

  -- Lahiru Gunasekara
  ('ce000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'Exercise-Induced Asthma', 'mild', '2024-01-15', NULL, 'Pre-exercise inhaler use', 'Salbutamol 100mcg inhaler (2 puffs before exercise)', 'managed', 'Well controlled. No limitations on sports activities with pre-treatment.', NOW() - INTERVAL '120 days');

-- ============================================
-- LINK PRESCRIPTIONS TO CHRONIC CONDITIONS
-- ============================================

INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration, status, chronic_condition_id) VALUES
  -- Sarah: Salbutamol for Asthma
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Salbutamol Inhaler', '100mcg', '2 puffs PRN', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000001' AND condition_name = 'Asthma')),
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Fluticasone Inhaler', '250mcg', 'Twice daily', '6 months', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000001' AND condition_name = 'Asthma')),

  -- Dinesh: Metformin for Type 2 Diabetes
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Metformin', '500mg', 'Twice daily', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Type 2 Diabetes Mellitus')),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Gliclazide', '80mg', 'Once daily', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Type 2 Diabetes Mellitus')),

  -- Dinesh: Amlodipine + Losartan for Essential Hypertension
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Amlodipine', '5mg', 'Once daily', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Essential Hypertension')),
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Losartan', '50mg', 'Once daily', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Essential Hypertension')),

  -- Dinesh: Atorvastatin for Hyperlipidemia
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', 'Atorvastatin', '20mg', 'Once daily (bedtime)', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Hyperlipidemia')),

  -- Nuwan: Naproxen + Omeprazole for Chronic Low Back Pain
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', 'Naproxen', '500mg', 'Twice daily PRN', '3 months', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000004' AND condition_name = 'Chronic Low Back Pain')),
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', 'Omeprazole', '20mg', 'Once daily', '3 months', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000004' AND condition_name = 'Chronic Low Back Pain')),

  -- Hasini: Sumatriptan + Propranolol for Migraine
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Sumatriptan', '50mg', 'As needed (max 2/day)', 'Ongoing', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000005' AND condition_name = 'Migraine without Aura')),
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Propranolol', '40mg', 'Twice daily', '6 months', 'active',
    (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000005' AND condition_name = 'Migraine without Aura'));

-- ============================================
-- LINK MEDICAL RECORDS TO CHRONIC CONDITIONS
-- Create diagnosis records for chronic conditions
-- ============================================

INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes, chronic_condition_id) VALUES
  -- Sarah: Asthma diagnosis
  ('ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001',
   'Bronchial Asthma (moderate persistent)', 'Trigger avoidance counseling: avoid dust, smoke, cold air. Peak flow diary to be maintained daily. Annual spirometry review. Flu vaccination recommended annually.',
   'Spirometry: FEV1 78% predicted. Reversibility test positive (+15%). No wheeze at rest. Good inhaler technique demonstrated.',
   (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000001' AND condition_name = 'Asthma')),

  -- Dinesh: Type 2 Diabetes diagnosis
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002',
   'Type 2 Diabetes Mellitus', 'Diabetic diet plan provided. Refer for diabetic eye screening and foot assessment. Self-monitor blood glucose twice daily. HbA1c target <7%. Quarterly follow-up.',
   'FBS 186 mg/dL. HbA1c 8.1%. BMI 29.4. No diabetic retinopathy on fundoscopy. Peripheral pulses intact.',
   (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Type 2 Diabetes Mellitus')),

  -- Dinesh: Essential Hypertension diagnosis
  ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002',
   'Essential Hypertension (Stage 2)', 'Lifestyle modifications: DASH diet, reduce sodium to <2g/day, regular aerobic exercise 150 min/week. Home BP monitoring twice daily. Monthly clinic review.',
   'BP 158/96 on 3 separate readings. Renal function normal (eGFR 95). ECG shows no LVH. Fundoscopy: no hypertensive retinopathy.',
   (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000002' AND condition_name = 'Essential Hypertension')),

  -- Nuwan: Chronic Low Back Pain diagnosis
  ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001',
   'Chronic Low Back Pain (L4-L5 disc protrusion)', 'Physiotherapy referral: core strengthening and McKenzie exercises. Ergonomic workplace assessment. Avoid heavy lifting >10kg. Hot pack application for pain relief. Review in 6 weeks.',
   'MRI lumbar spine: L4-L5 posterolateral disc protrusion with mild nerve root compression. Straight leg raise positive at 60 degrees. No cauda equina symptoms. Power 5/5 all muscle groups.',
   (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000004' AND condition_name = 'Chronic Low Back Pain')),

  -- Hasini: Migraine diagnosis
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004',
   'Migraine without Aura (episodic)', 'Trigger diary to identify patterns. Sleep hygiene: regular schedule, 7-8 hours/night. Adequate hydration (2L/day). Stress management techniques. Avoid known dietary triggers. Follow-up in 4 weeks.',
   'Headache frequency 4/month, duration 8-12 hours. CT brain normal. Meets ICHD-3 criteria for migraine without aura. No papilledema. Neurological exam normal.',
   (SELECT id FROM chronic_conditions WHERE patient_id = 'ce000000-0000-0000-0000-000000000005' AND condition_name = 'Migraine without Aura'));

-- ============================================
-- DOCTOR SCHEDULES (Mon-Fri 08:00-17:00)
-- ============================================

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active) VALUES
  -- Dr. Kamal Perera (Cardiology)
  ('dc000000-0000-0000-0000-000000000001', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000001', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000001', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000001', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000001', 5, '08:00', '17:00', true),
  -- Dr. Sithara Silva (Neurology)
  ('dc000000-0000-0000-0000-000000000002', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000002', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000002', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000002', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000002', 5, '08:00', '17:00', true),
  -- Dr. Ruwan Fernando (Orthopedics)
  ('dc000000-0000-0000-0000-000000000003', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000003', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000003', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000003', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000003', 5, '08:00', '17:00', true),
  -- Dr. Anjali Dissanayake (Pediatrics) — inactive
  ('dc000000-0000-0000-0000-000000000004', 1, '08:00', '17:00', false),
  ('dc000000-0000-0000-0000-000000000004', 2, '08:00', '17:00', false),
  ('dc000000-0000-0000-0000-000000000004', 3, '08:00', '17:00', false),
  ('dc000000-0000-0000-0000-000000000004', 4, '08:00', '17:00', false),
  ('dc000000-0000-0000-0000-000000000004', 5, '08:00', '17:00', false);

-- ============================================
-- PRESCRIPTION TEMPLATES (doctor-specific reusable templates)
-- ============================================

INSERT INTO prescription_templates (id, doctor_id, name, description) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Hypertension Standard', 'Standard first-line treatment for essential hypertension'),
  ('f1000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000001', 'Cardiac Post-MI', 'Post-myocardial infarction maintenance therapy'),
  ('f1000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000002', 'Migraine Prophylaxis', 'Prophylactic treatment for chronic migraine'),
  ('f1000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000003', 'Musculoskeletal Pain', 'Standard pain management for MSK injuries'),
  ('f1000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Iron Deficiency Anemia', 'Standard iron supplementation protocol');

INSERT INTO prescription_template_items (template_id, medication, dosage, frequency, duration, instructions, sort_order) VALUES
  -- Hypertension Standard
  ('f1000000-0000-0000-0000-000000000001', 'Amlodipine', '5mg', 'Once daily', '3 months', 'Take in the morning', 0),
  ('f1000000-0000-0000-0000-000000000001', 'Losartan', '50mg', 'Once daily', '3 months', 'Monitor blood pressure weekly', 1),
  ('f1000000-0000-0000-0000-000000000001', 'Aspirin', '75mg', 'Once daily', 'Ongoing', 'Take after breakfast', 2),

  -- Cardiac Post-MI
  ('f1000000-0000-0000-0000-000000000002', 'Aspirin', '75mg', 'Once daily', 'Ongoing', 'Do not stop without medical advice', 0),
  ('f1000000-0000-0000-0000-000000000002', 'Clopidogrel', '75mg', 'Once daily', '1 year', 'Dual antiplatelet therapy', 1),
  ('f1000000-0000-0000-0000-000000000002', 'Atorvastatin', '40mg', 'Once daily', 'Ongoing', 'Take at bedtime', 2),
  ('f1000000-0000-0000-0000-000000000002', 'Metoprolol', '50mg', 'Twice daily', 'Ongoing', 'Do not stop abruptly', 3),

  -- Migraine Prophylaxis
  ('f1000000-0000-0000-0000-000000000003', 'Amitriptyline', '25mg', 'At bedtime', '3 months', 'Start with 10mg, increase to 25mg after 1 week', 0),
  ('f1000000-0000-0000-0000-000000000003', 'Sumatriptan', '50mg', 'As needed', 'Ongoing', 'Max 2 tablets per day. Not for prophylaxis.', 1),

  -- Musculoskeletal Pain
  ('f1000000-0000-0000-0000-000000000004', 'Ibuprofen', '400mg', 'Three times daily', '2 weeks', 'Take after meals', 0),
  ('f1000000-0000-0000-0000-000000000004', 'Omeprazole', '20mg', 'Once daily', '2 weeks', 'Gastric protection while on NSAIDs', 1),
  ('f1000000-0000-0000-0000-000000000004', 'Paracetamol', '500mg', 'As needed', '2 weeks', 'Max 4g per day. Use between NSAID doses.', 2),

  -- Iron Deficiency Anemia
  ('f1000000-0000-0000-0000-000000000005', 'Ferrous Sulfate', '200mg', 'Twice daily', '3 months', 'Take on empty stomach with vitamin C', 0),
  ('f1000000-0000-0000-0000-000000000005', 'Folic Acid', '5mg', 'Once daily', '3 months', 'Supports red blood cell production', 1),
  ('f1000000-0000-0000-0000-000000000005', 'Vitamin C', '500mg', 'Once daily', '3 months', 'Enhances iron absorption', 2);

-- ============================================
-- PATIENT FEEDBACK (satisfaction ratings)
-- ============================================

-- Sarah Fernando rated Dr. Kamal Perera (Cardiology) — completed appointment 30 days ago
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', a.id,
       5, 5, 4, 5, 'Dr. Perera was very thorough and explained my condition clearly. Excellent cardiac care.', false, NOW() - INTERVAL '29 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000001' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000001' AND a.status = 'completed' LIMIT 1;

-- Dinesh Rajapaksa rated Dr. Sithara Silva (Neurology) — completed appointment 25 days ago
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002', a.id,
       4, 4, 3, 5, 'Good neurological assessment. Wait time was a bit long but the consultation was thorough.', false, NOW() - INTERVAL '24 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000002' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000002' AND a.status = 'completed' LIMIT 1;

-- Kavindi Weerasinghe rated Dr. Ruwan Fernando (Orthopedics) — completed appointment 20 days ago
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', a.id,
       5, 5, 5, 5, 'Dr. Fernando was fantastic. He explained my knee injury very clearly and the physical therapy plan is working well.', false, NOW() - INTERVAL '19 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000003' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000003' AND a.status = 'completed' LIMIT 1;

-- Nuwan Jayasuriya rated Dr. Kamal Perera (Cardiology) — completed appointment 15 days ago
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001', a.id,
       4, 5, 3, 4, 'Dr. Perera managed my AF well. Had to wait 30 minutes but the consultation was worth it.', false, NOW() - INTERVAL '14 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000004' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000001' AND a.status = 'completed' LIMIT 1;

-- Nuwan Jayasuriya rated Dr. Sithara Silva (Neurology) — anonymous
INSERT INTO patient_feedback (patient_id, doctor_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
VALUES ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000002',
        3, 3, 2, 4, 'The treatment was good but I had to wait over an hour for my appointment.', true, NOW() - INTERVAL '11 days');

-- Sarah Fernando rated Dr. Sithara Silva (Neurology) — completed appointment 10 days ago
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000002', a.id,
       5, 5, 4, 5, 'Very professional neurological screening. Everything was explained well.', false, NOW() - INTERVAL '9 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000001' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000002' AND a.status = 'completed' LIMIT 1;

-- Hasini Abeywickrama rated Dr. Anjali Dissanayake (Pediatrics)
INSERT INTO patient_feedback (patient_id, doctor_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
VALUES ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004',
        4, 5, 4, 4, 'Dr. Dissanayake was very caring and patient. Good follow-up on my anemia treatment.', false, NOW() - INTERVAL '7 days');

-- Lahiru Gunasekara rated Dr. Ruwan Fernando (Orthopedics)
INSERT INTO patient_feedback (patient_id, doctor_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
VALUES ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003',
        5, 5, 5, 5, 'Excellent sports injury care. Dr. Fernando understood my concerns about returning to cricket.', false, NOW() - INTERVAL '4 days');

-- ============================================
-- LAB TEST REQUESTS (doctor-initiated)
-- ============================================

-- Dr. Kamal Perera requests INR follow-up for Nuwan Jayasuriya (completed — linked to existing lab report)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, assigned_to, created_at, updated_at)
VALUES ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001',
        'INR (Prothrombin Time)', 'normal', 'Monthly INR monitoring for Warfarin therapy. Target range 2.0-3.0.',
        'completed', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days');

-- Dr. Sithara Silva requests MRI for Dinesh Rajapaksa (completed)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, assigned_to, created_at, updated_at)
VALUES ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002',
        'MRI Brain', 'normal', 'Follow-up for recurring headaches. Previous MRI was normal, recheck after 6 months.',
        'completed', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '25 days', NOW() - INTERVAL '22 days');

-- Dr. Anjali Dissanayake requests CBC for Hasini Abeywickrama (in_progress)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, assigned_to, created_at, updated_at)
VALUES ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004',
        'Complete Blood Count (CBC)', 'normal', 'Follow-up CBC to check hemoglobin improvement after 6 weeks of iron supplementation.',
        'in_progress', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

-- Dr. Kamal Perera requests Echocardiogram for Nuwan Jayasuriya (pending)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, created_at)
VALUES ('ce000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000001',
        'Echocardiogram', 'normal', 'Annual cardiac assessment. Check ejection fraction and valve function.',
        'pending', NOW() - INTERVAL '1 day');

-- Dr. Ruwan Fernando requests MRI knee for Lahiru Gunasekara (pending, urgent)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, created_at)
VALUES ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003',
        'MRI Left Knee (Follow-up)', 'urgent', 'Re-evaluate ACL healing progress at 3-month mark. Compare with previous MRI.',
        'pending', NOW() - INTERVAL '6 hours');

-- Dr. Sithara Silva requests HbA1c for Dinesh Rajapaksa (pending)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, created_at)
VALUES ('ce000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000002',
        'HbA1c', 'normal', 'Quarterly diabetic monitoring. Target HbA1c <7%. Last was 7.2%.',
        'pending', NOW() - INTERVAL '3 hours');

-- Lab test request notifications (both lab technicians get notified for each pending request)
INSERT INTO notifications (recipient_id, type, title, message, is_read, reference_type, created_at) VALUES
  -- Echocardiogram for Nuwan (pending) → patient + both lab techs
  ('c0000000-0000-0000-0000-000000000004', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Kamal Perera has ordered an Echocardiogram test for you.', false, 'lab_test_request', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000001', 'lab_test_requested', 'New Lab Test Request', 'Dr. Kamal Perera ordered Echocardiogram for Nuwan Jayasuriya.', false, 'lab_test_request', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000002', 'lab_test_requested', 'New Lab Test Request', 'Dr. Kamal Perera ordered Echocardiogram for Nuwan Jayasuriya.', false, 'lab_test_request', NOW() - INTERVAL '1 day'),

  -- MRI Left Knee for Lahiru (pending, urgent) → patient + both lab techs
  ('c0000000-0000-0000-0000-000000000006', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Ruwan Fernando has ordered a MRI Left Knee (Follow-up) test for you.', false, 'lab_test_request', NOW() - INTERVAL '6 hours'),
  ('10000000-0000-0000-0000-000000000001', 'lab_test_requested', 'New Lab Test Request', 'Dr. Ruwan Fernando ordered MRI Left Knee (Follow-up) for Lahiru Gunasekara. (URGENT)', false, 'lab_test_request', NOW() - INTERVAL '6 hours'),
  ('10000000-0000-0000-0000-000000000002', 'lab_test_requested', 'New Lab Test Request', 'Dr. Ruwan Fernando ordered MRI Left Knee (Follow-up) for Lahiru Gunasekara. (URGENT)', false, 'lab_test_request', NOW() - INTERVAL '6 hours'),

  -- HbA1c for Dinesh (pending) → patient + both lab techs
  ('c0000000-0000-0000-0000-000000000002', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Sithara Silva has ordered a HbA1c test for you.', false, 'lab_test_request', NOW() - INTERVAL '3 hours'),
  ('10000000-0000-0000-0000-000000000001', 'lab_test_requested', 'New Lab Test Request', 'Dr. Sithara Silva ordered HbA1c for Dinesh Rajapaksa.', false, 'lab_test_request', NOW() - INTERVAL '3 hours'),
  ('10000000-0000-0000-0000-000000000002', 'lab_test_requested', 'New Lab Test Request', 'Dr. Sithara Silva ordered HbA1c for Dinesh Rajapaksa.', false, 'lab_test_request', NOW() - INTERVAL '3 hours');

-- Feedback notifications for doctors
INSERT INTO notifications (recipient_id, type, title, message, is_read, reference_type, created_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', true, 'feedback', NOW() - INTERVAL '29 days'),
  ('d0000000-0000-0000-0000-000000000002', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', true, 'feedback', NOW() - INTERVAL '24 days'),
  ('d0000000-0000-0000-0000-000000000003', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '19 days'),
  ('d0000000-0000-0000-0000-000000000001', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '14 days'),
  ('d0000000-0000-0000-0000-000000000002', 'feedback_received', 'New Patient Feedback', 'You received a 3-star rating from an anonymous patient.', false, 'feedback', NOW() - INTERVAL '11 days'),
  ('d0000000-0000-0000-0000-000000000002', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '9 days'),
  ('d0000000-0000-0000-0000-000000000004', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '7 days'),
  ('d0000000-0000-0000-0000-000000000003', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '4 days');

COMMIT;
