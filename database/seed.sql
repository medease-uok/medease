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
  ('a0000000-0000-0000-0000-000000000001', 'admin@medease.com', crypt('Password@123', gen_salt('bf')), 'System', 'Admin', 'admin', '+94771000001', true);

-- Doctors
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'kamal.perera@medease.com', crypt('Password@123', gen_salt('bf')), 'Kamal', 'Perera', 'doctor', '+94772000001', '1980-05-14', true, 'default-images/58509043_9439678.jpg'),
  ('d0000000-0000-0000-0000-000000000002', 'sithara.silva@medease.com', crypt('Password@123', gen_salt('bf')), 'Sithara', 'Silva', 'doctor', '+94772000002', '1983-09-22', true, 'default-images/58509051_9439729.jpg'),
  ('d0000000-0000-0000-0000-000000000003', 'ruwan.fernando@medease.com', crypt('Password@123', gen_salt('bf')), 'Ruwan', 'Fernando', 'doctor', '+94772000003', '1986-01-10', true, 'default-images/58509054_9441186.jpg'),
  ('d0000000-0000-0000-0000-000000000004', 'anjali.dissanayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Anjali', 'Dissanayake', 'doctor', '+94772000004', '1988-11-03', true, 'default-images/58509055_9439726.jpg'),
  ('d0000000-0000-0000-0000-000000000005', 'tharanga.wickramasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Tharanga', 'Wickramasinghe', 'doctor', '+94772000005', '1979-04-20', true, 'default-images/58509043_9439678.jpg'),
  ('d0000000-0000-0000-0000-000000000006', 'nimasha.gunaratne@medease.com', crypt('Password@123', gen_salt('bf')), 'Nimasha', 'Gunaratne', 'doctor', '+94772000006', '1984-08-15', true, 'default-images/58509051_9439729.jpg'),
  ('d0000000-0000-0000-0000-000000000007', 'prasad.jayasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Prasad', 'Jayasinghe', 'doctor', '+94772000007', '1981-12-02', true, 'default-images/58509054_9441186.jpg'),
  ('d0000000-0000-0000-0000-000000000008', 'dilini.senanayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Dilini', 'Senanayake', 'doctor', '+94772000008', '1987-06-28', true, 'default-images/58509058_9442242.jpg'),
  ('d0000000-0000-0000-0000-000000000009', 'rohan.demel@medease.com', crypt('Password@123', gen_salt('bf')), 'Rohan', 'de Mel', 'doctor', '+94772000009', '1977-03-11', true, 'default-images/58509043_9439678.jpg'),
  ('d0000000-0000-0000-0000-000000000010', 'chamari.wijesundara@medease.com', crypt('Password@123', gen_salt('bf')), 'Chamari', 'Wijesundara', 'doctor', '+94772000010', '1982-07-19', true, 'default-images/58509051_9439729.jpg'),
  ('d0000000-0000-0000-0000-000000000011', 'asanka.pathirana@medease.com', crypt('Password@123', gen_salt('bf')), 'Asanka', 'Pathirana', 'doctor', '+94772000011', '1985-10-05', true, 'default-images/58509054_9441186.jpg'),
  ('d0000000-0000-0000-0000-000000000012', 'malsha.kulathunga@medease.com', crypt('Password@123', gen_salt('bf')), 'Malsha', 'Kulathunga', 'doctor', '+94772000012', '1990-02-28', true, 'default-images/58509055_9439726.jpg');

-- Nurses
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'malini.bandara@medease.com', crypt('Password@123', gen_salt('bf')), 'Malini', 'Bandara', 'nurse', '+94773000001', '1990-03-18', true, 'default-images/58509058_9442242.jpg'),
  ('e0000000-0000-0000-0000-000000000002', 'chamari.rathnayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Chamari', 'Rathnayake', 'nurse', '+94773000002', '1992-07-25', true, 'default-images/58509051_9439729.jpg'),
  ('e0000000-0000-0000-0000-000000000003', 'priyanka.kumari@medease.com', crypt('Password@123', gen_salt('bf')), 'Priyanka', 'Kumari', 'nurse', '+94773000003', '1994-12-05', true, 'default-images/58509055_9439726.jpg'),
  ('e0000000-0000-0000-0000-000000000004', 'iresha.samarawickrama@medease.com', crypt('Password@123', gen_salt('bf')), 'Iresha', 'Samarawickrama', 'nurse', '+94773000004', '1991-05-10', true, 'default-images/58509058_9442242.jpg'),
  ('e0000000-0000-0000-0000-000000000005', 'kasun.thilakarathne@medease.com', crypt('Password@123', gen_salt('bf')), 'Kasun', 'Thilakarathne', 'nurse', '+94773000005', '1993-09-17', true, 'default-images/58509057_9440461.jpg'),
  ('e0000000-0000-0000-0000-000000000006', 'nadeeka.wijeratne@medease.com', crypt('Password@123', gen_salt('bf')), 'Nadeeka', 'Wijeratne', 'nurse', '+94773000006', '1995-01-22', true, 'default-images/58509051_9439729.jpg'),
  ('e0000000-0000-0000-0000-000000000007', 'sampath.ranasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Sampath', 'Ranasinghe', 'nurse', '+94773000007', '1989-11-30', true, 'default-images/58509043_9439678.jpg'),
  ('e0000000-0000-0000-0000-000000000008', 'harsha.jayamanne@medease.com', crypt('Password@123', gen_salt('bf')), 'Harsha', 'Jayamanne', 'nurse', '+94773000008', '1996-03-14', true, 'default-images/58509057_9440461.jpg'),
  ('e0000000-0000-0000-0000-000000000009', 'rashmi.peiris@medease.com', crypt('Password@123', gen_salt('bf')), 'Rashmi', 'Peiris', 'nurse', '+94773000009', '1988-08-22', true, 'default-images/58509055_9439726.jpg'),
  ('e0000000-0000-0000-0000-000000000010', 'dinusha.fonseka@medease.com', crypt('Password@123', gen_salt('bf')), 'Dinusha', 'Fonseka', 'nurse', '+94773000010', '1992-11-07', true, 'default-images/58509058_9442242.jpg');

-- Lab Technicians
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('10000000-0000-0000-0000-000000000001', 'nimal.wijesinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Nimal', 'Wijesinghe', 'lab_technician', '+94774000001', '1987-06-20', true, 'default-images/58509057_9440461.jpg'),
  ('10000000-0000-0000-0000-000000000002', 'sanduni.herath@medease.com', crypt('Password@123', gen_salt('bf')), 'Sanduni', 'Herath', 'lab_technician', '+94774000002', '1993-04-11', true, 'default-images/58509058_9442242.jpg'),
  ('10000000-0000-0000-0000-000000000003', 'gayan.kumarasiri@medease.com', crypt('Password@123', gen_salt('bf')), 'Gayan', 'Kumarasiri', 'lab_technician', '+94774000003', '1990-09-18', true, 'default-images/58509043_9439678.jpg'),
  ('10000000-0000-0000-0000-000000000004', 'anusha.wimalasena@medease.com', crypt('Password@123', gen_salt('bf')), 'Anusha', 'Wimalasena', 'lab_technician', '+94774000004', '1995-01-25', true, 'default-images/58509051_9439729.jpg');

-- Pharmacists
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'tharindu.gamage@medease.com', crypt('Password@123', gen_salt('bf')), 'Tharindu', 'Gamage', 'pharmacist', '+94775000001', '1989-08-30', true, 'default-images/58509043_9439678.jpg'),
  ('b0000000-0000-0000-0000-000000000002', 'dilani.mendis@medease.com', crypt('Password@123', gen_salt('bf')), 'Dilani', 'Mendis', 'pharmacist', '+94775000002', '1991-02-14', true, 'default-images/58509055_9439726.jpg'),
  ('b0000000-0000-0000-0000-000000000003', 'chathura.nandasiri@medease.com', crypt('Password@123', gen_salt('bf')), 'Chathura', 'Nandasiri', 'pharmacist', '+94775000003', '1994-06-09', true, 'default-images/58509054_9441186.jpg');

-- Patients (DOB is on the patients table for this role)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'sarah.fernando@medease.com', crypt('Password@123', gen_salt('bf')), 'Sarah', 'Fernando', 'patient', '+94776000001', true),
  ('c0000000-0000-0000-0000-000000000002', 'dinesh.rajapaksa@medease.com', crypt('Password@123', gen_salt('bf')), 'Dinesh', 'Rajapaksa', 'patient', '+94776000002', true),
  ('c0000000-0000-0000-0000-000000000003', 'kavindi.weerasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Kavindi', 'Weerasinghe', 'patient', '+94776000003', true),
  ('c0000000-0000-0000-0000-000000000004', 'nuwan.jayasuriya@medease.com', crypt('Password@123', gen_salt('bf')), 'Nuwan', 'Jayasuriya', 'patient', '+94776000004', true),
  ('c0000000-0000-0000-0000-000000000005', 'hasini.abeywickrama@medease.com', crypt('Password@123', gen_salt('bf')), 'Hasini', 'Abeywickrama', 'patient', '+94776000005', true),
  ('c0000000-0000-0000-0000-000000000006', 'lahiru.gunasekara@medease.com', crypt('Password@123', gen_salt('bf')), 'Lahiru', 'Gunasekara', 'patient', '+94776000006', true),
  ('c0000000-0000-0000-0000-000000000007', 'amaya.perera@medease.com', crypt('Password@123', gen_salt('bf')), 'Amaya', 'Perera', 'patient', '+94776000007', true),
  ('c0000000-0000-0000-0000-000000000008', 'sachini.karunaratne@medease.com', crypt('Password@123', gen_salt('bf')), 'Sachini', 'Karunaratne', 'patient', '+94776000008', true),
  ('c0000000-0000-0000-0000-000000000009', 'ravindu.jayawardena@medease.com', crypt('Password@123', gen_salt('bf')), 'Ravindu', 'Jayawardena', 'patient', '+94776000009', true),
  ('c0000000-0000-0000-0000-000000000010', 'thilini.wickramasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Thilini', 'Wickramasinghe', 'patient', '+94776000010', true),
  ('c0000000-0000-0000-0000-000000000011', 'chaminda.bandara@medease.com', crypt('Password@123', gen_salt('bf')), 'Chaminda', 'Bandara', 'patient', '+94776000011', true),
  ('c0000000-0000-0000-0000-000000000012', 'nadeesha.silva@medease.com', crypt('Password@123', gen_salt('bf')), 'Nadeesha', 'Silva', 'patient', '+94776000012', true),
  ('c0000000-0000-0000-0000-000000000013', 'isuru.abeysekara@medease.com', crypt('Password@123', gen_salt('bf')), 'Isuru', 'Abeysekara', 'patient', '+94776000013', true),
  ('c0000000-0000-0000-0000-000000000014', 'dilhani.mendis@medease.com', crypt('Password@123', gen_salt('bf')), 'Dilhani', 'Mendis', 'patient', '+94776000014', true),
  ('c0000000-0000-0000-0000-000000000015', 'janaka.herath@medease.com', crypt('Password@123', gen_salt('bf')), 'Janaka', 'Herath', 'patient', '+94776000015', true),
  ('c0000000-0000-0000-0000-000000000016', 'sandamali.peris@medease.com', crypt('Password@123', gen_salt('bf')), 'Sandamali', 'Peris', 'patient', '+94776000016', true),
  ('c0000000-0000-0000-0000-000000000017', 'tharindu.wijesinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Tharindu', 'Wijesinghe', 'patient', '+94776000017', true),
  ('c0000000-0000-0000-0000-000000000018', 'nethmi.samarakoon@medease.com', crypt('Password@123', gen_salt('bf')), 'Nethmi', 'Samarakoon', 'patient', '+94776000018', true),
  ('c0000000-0000-0000-0000-000000000019', 'arjuna.ranatunga@medease.com', crypt('Password@123', gen_salt('bf')), 'Arjuna', 'Ranatunga', 'patient', '+94776000019', true),
  ('c0000000-0000-0000-0000-000000000020', 'sewwandi.liyanage@medease.com', crypt('Password@123', gen_salt('bf')), 'Sewwandi', 'Liyanage', 'patient', '+94776000020', true),
  ('c0000000-0000-0000-0000-000000000021', 'malith.de.silva@medease.com', crypt('Password@123', gen_salt('bf')), 'Malith', 'de Silva', 'patient', '+94776000021', true),
  ('c0000000-0000-0000-0000-000000000022', 'hiruni.rathnayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Hiruni', 'Rathnayake', 'patient', '+94776000022', true),
  ('c0000000-0000-0000-0000-000000000023', 'buddhika.senanayake@medease.com', crypt('Password@123', gen_salt('bf')), 'Buddhika', 'Senanayake', 'patient', '+94776000023', true),
  ('c0000000-0000-0000-0000-000000000024', 'shanika.de.soysa@medease.com', crypt('Password@123', gen_salt('bf')), 'Shanika', 'de Soysa', 'patient', '+94776000024', true),
  ('c0000000-0000-0000-0000-000000000025', 'roshan.gunawardena@medease.com', crypt('Password@123', gen_salt('bf')), 'Roshan', 'Gunawardena', 'patient', '+94776000025', true),
  ('c0000000-0000-0000-0000-000000000026', 'imalka.jayathilaka@medease.com', crypt('Password@123', gen_salt('bf')), 'Imalka', 'Jayathilaka', 'patient', '+94776000026', true),
  ('c0000000-0000-0000-0000-000000000027', 'dilan.wijetunga@medease.com', crypt('Password@123', gen_salt('bf')), 'Dilan', 'Wijetunga', 'patient', '+94776000027', true),
  ('c0000000-0000-0000-0000-000000000028', 'nishadi.kumarasinghe@medease.com', crypt('Password@123', gen_salt('bf')), 'Nishadi', 'Kumarasinghe', 'patient', '+94776000028', true),
  ('c0000000-0000-0000-0000-000000000029', 'chamika.pathirana@medease.com', crypt('Password@123', gen_salt('bf')), 'Chamika', 'Pathirana', 'patient', '+94776000029', true),
  ('c0000000-0000-0000-0000-000000000030', 'thisari.weerasekara@medease.com', crypt('Password@123', gen_salt('bf')), 'Thisari', 'Weerasekara', 'patient', '+94776000030', true);

-- ============================================
-- DOCTORS (profiles)
-- ============================================

INSERT INTO doctors (id, user_id, specialization, license_number, department, available, gender) VALUES
  ('dc000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Cardiology', 'SLMC-2015-4521', 'Cardiology', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Neurology', 'SLMC-2016-7832', 'Neurology', true, 'Female'),
  ('dc000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Orthopedics', 'SLMC-2018-3294', 'Orthopedics', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Pediatrics', 'SLMC-2019-5617', 'Pediatrics', false, 'Female'),
  ('dc000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'Dermatology', 'SLMC-2014-2198', 'Dermatology', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', 'Gynecology', 'SLMC-2017-6543', 'Obstetrics & Gynecology', true, 'Female'),
  ('dc000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'General Surgery', 'SLMC-2015-8712', 'Surgery', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008', 'Psychiatry', 'SLMC-2018-4390', 'Psychiatry', true, 'Female'),
  ('dc000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000009', 'ENT', 'SLMC-2012-1847', 'ENT', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000010', 'Ophthalmology', 'SLMC-2016-9021', 'Ophthalmology', true, 'Female'),
  ('dc000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000011', 'Pulmonology', 'SLMC-2017-5438', 'Pulmonology', true, 'Male'),
  ('dc000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000012', 'Endocrinology', 'SLMC-2020-7654', 'Endocrinology', true, 'Female');

-- ============================================
-- PATIENTS (profiles)
-- ============================================

INSERT INTO patients (id, user_id, date_of_birth, gender, blood_type, organ_donor, organ_donor_card_no, organs_to_donate, address, emergency_contact, emergency_relationship, emergency_phone, profile_image_url, insurance_provider, insurance_policy_number, insurance_plan_type, insurance_expiry_date) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1990-03-15', 'Female', 'O+', true, 'NTP-2023-08451', ARRAY['Kidneys','Liver','Eyes'], '45 Galle Road, Colombo 03', 'Amal Fernando', 'Spouse', '+94771234567', 'default-images/58509051_9439729.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2024-08932', 'Comprehensive', '2029-03-31'),
  ('ce000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '1985-07-22', 'Male', 'A+', false, NULL, NULL, '12 Kandy Road, Peradeniya', 'Kamala Rajapaksa', 'Parent', '+94772345678', 'default-images/58509043_9439678.jpg', 'Ceylinco Insurance', 'CEY-MED-2024-45210', 'Inpatient', '2028-12-31'),
  ('ce000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '1995-11-08', 'Female', 'B+', true, 'NTP-2024-12930', ARRAY['Eyes','Heart','Lungs','Kidneys'], '78 Temple Road, Nugegoda', 'Sunil Weerasinghe', 'Parent', '+94773456789', 'default-images/58509055_9439726.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-71034', 'Comprehensive', '2029-06-30'),
  ('ce000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '1978-01-30', 'Male', 'AB-', false, NULL, NULL, '23 Lake Drive, Kurunegala', 'Priya Jayasuriya', 'Spouse', '+94774567890', 'default-images/58509054_9441186.jpg', NULL, NULL, NULL, NULL),
  ('ce000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '2000-06-12', 'Female', 'O-', true, 'NTP-2025-03217', ARRAY['Kidneys','Liver','Pancreas','Skin'], '56 Beach Road, Matara', 'Kumari Abeywickrama', 'Parent', '+94775678901', 'default-images/58509058_9442242.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2025-33891', 'Outpatient', '2028-09-30'),
  ('ce000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '1992-09-25', 'Male', 'A-', false, NULL, NULL, '34 Hill Street, Galle', 'Nirmala Gunasekara', 'Sibling', '+94776789012', 'default-images/58509057_9440461.jpg', 'Union Assurance', 'UA-HEALTH-2024-12567', 'Inpatient', '2028-04-15'),
  ('ce000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', '1997-02-14', 'Female', 'B-', false, NULL, NULL, '22 Park Avenue, Dehiwala', 'Kumara Perera', 'Spouse', '+94777890123', 'default-images/58509055_9439726.jpg', 'Ceylinco Insurance', 'CEY-MED-2025-78123', 'Comprehensive', '2029-08-31'),
  ('ce000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', '1988-05-30', 'Female', 'AB+', true, 'NTP-2024-19832', ARRAY['Kidneys','Liver'], '89 Station Road, Panadura', 'Mahesh Karunaratne', 'Spouse', '+94778901234', 'default-images/58509058_9442242.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-82910', 'Inpatient', '2029-01-31'),
  ('ce000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', '2001-11-18', 'Male', 'O+', false, NULL, NULL, '15 Main Street, Ratnapura', 'Kumari Jayawardena', 'Parent', '+94779012345', 'default-images/58509043_9439678.jpg', NULL, NULL, NULL, NULL),
  ('ce000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', '1993-07-08', 'Female', 'A+', true, 'NTP-2025-05621', ARRAY['Eyes','Heart'], '67 Temple Lane, Kandy', 'Ajith Wickramasinghe', 'Parent', '+94770123456', 'default-images/58509051_9439729.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2025-11289', 'Outpatient', '2029-05-31'),
  ('ce000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', '1975-03-22', 'Male', 'B+', false, NULL, NULL, '4 Lake View, Anuradhapura', 'Malini Bandara', 'Spouse', '+94771234590', 'default-images/58509054_9441186.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2025-44231', 'Comprehensive', '2028-11-30'),
  ('ce000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', '1999-09-12', 'Female', 'O-', false, NULL, NULL, '31 Flower Road, Colombo 07', 'Ranjith Silva', 'Parent', '+94772345691', 'default-images/58509055_9439726.jpg', 'Union Assurance', 'UA-HEALTH-2025-55678', 'Inpatient', '2029-02-28'),
  ('ce000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000013', '1982-12-05', 'Male', 'AB-', true, 'NTP-2023-21045', ARRAY['Kidneys','Pancreas','Liver'], '55 Circular Road, Batticaloa', 'Priya Abeysekara', 'Spouse', '+94773456792', 'default-images/58509057_9440461.jpg', 'Ceylinco Insurance', 'CEY-MED-2024-92341', 'Comprehensive', '2028-07-31'),
  ('ce000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000014', '1996-04-25', 'Female', 'A-', false, NULL, NULL, '12 Sea Street, Jaffna', 'Kumara Mendis', 'Parent', '+94774567893', 'default-images/58509058_9442242.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-67123', 'Outpatient', '2029-10-31'),
  ('ce000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', '1970-08-14', 'Male', 'O+', false, NULL, NULL, '99 Bauddhaloka Mw, Colombo 04', 'Sunethra Herath', 'Spouse', '+94775678904', 'default-images/58509043_9439678.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2024-15678', 'Comprehensive', '2028-06-30'),
  ('ce000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000016', '1998-01-30', 'Female', 'B+', true, 'NTP-2025-08910', ARRAY['Kidneys','Eyes'], '18 Havelock Road, Colombo 05', 'Ranjith Peris', 'Parent', '+94776789015', 'default-images/58509051_9439729.jpg', 'Ceylinco Insurance', 'CEY-MED-2025-99012', 'Inpatient', '2029-04-30'),
  ('ce000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000017', '1985-06-18', 'Male', 'AB+', false, NULL, NULL, '42 Negombo Road, Wattala', 'Nishanthi Wijesinghe', 'Spouse', '+94777890126', 'default-images/58509054_9441186.jpg', NULL, NULL, NULL, NULL),
  ('ce000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000018', '2003-12-01', 'Female', 'A+', false, NULL, NULL, '7 Lotus Road, Moratuwa', 'Kamani Samarakoon', 'Parent', '+94778901237', 'default-images/58509055_9439726.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2025-78901', 'Outpatient', '2029-07-31'),
  ('ce000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000019', '1968-09-05', 'Male', 'O-', true, 'NTP-2022-04567', ARRAY['Kidneys','Liver','Heart','Lungs','Pancreas'], '150 Galle Face Drive, Colombo 01', 'Lalitha Ranatunga', 'Spouse', '+94779012348', 'default-images/58509057_9440461.jpg', 'Union Assurance', 'UA-HEALTH-2024-34567', 'Comprehensive', '2028-10-31'),
  ('ce000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000020', '1994-04-17', 'Female', 'B-', false, NULL, NULL, '28 Baseline Road, Borella', 'Ajith Liyanage', 'Parent', '+94770123459', 'default-images/58509058_9442242.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-23456', 'Inpatient', '2029-09-30'),
  ('ce000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000021', '1991-03-08', 'Male', 'A+', false, NULL, NULL, '72 Duplication Road, Colombo 04', 'Kumari de Silva', 'Spouse', '+94776100021', 'default-images/58509043_9439678.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2025-20345', 'Comprehensive', '2029-03-31'),
  ('ce000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000022', '1987-11-25', 'Female', 'O+', true, 'NTP-2024-30012', ARRAY['Kidneys','Eyes','Liver'], '14 Ward Place, Colombo 07', 'Suresh Rathnayake', 'Spouse', '+94776100022', 'default-images/58509051_9439729.jpg', 'Ceylinco Insurance', 'CEY-MED-2025-10234', 'Inpatient', '2029-06-30'),
  ('ce000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000023', '1973-06-14', 'Male', 'B-', false, NULL, NULL, '38 Kynsey Road, Colombo 08', 'Padmini Senanayake', 'Spouse', '+94776100023', 'default-images/58509054_9441186.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2025-55890', 'Comprehensive', '2028-12-31'),
  ('ce000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000024', '2000-09-02', 'Female', 'AB+', false, NULL, NULL, '5 Gregory Road, Colombo 07', 'Nimal de Soysa', 'Parent', '+94776100024', 'default-images/58509055_9439726.jpg', NULL, NULL, NULL, NULL),
  ('ce000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000025', '1980-01-19', 'Male', 'O-', true, 'NTP-2023-45678', ARRAY['Kidneys','Heart'], '91 High Level Road, Maharagama', 'Dilrukshi Gunawardena', 'Spouse', '+94776100025', 'default-images/58509057_9440461.jpg', 'Union Assurance', 'UA-HEALTH-2025-78901', 'Inpatient', '2029-01-31'),
  ('ce000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000026', '1995-07-30', 'Female', 'A-', false, NULL, NULL, '26 Rosmead Place, Colombo 07', 'Jayantha Jayathilaka', 'Parent', '+94776100026', 'default-images/58509058_9442242.jpg', 'AIA Insurance Lanka', 'AIA-HP-2025-34567', 'Outpatient', '2029-08-31'),
  ('ce000000-0000-0000-0000-000000000027', 'c0000000-0000-0000-0000-000000000027', '1983-04-11', 'Male', 'B+', false, NULL, NULL, '63 Thimbirigasyaya Road, Colombo 05', 'Anoma Wijetunga', 'Spouse', '+94776100027', 'default-images/58509043_9439678.jpg', 'Ceylinco Insurance', 'CEY-MED-2024-67890', 'Comprehensive', '2028-08-31'),
  ('ce000000-0000-0000-0000-000000000028', 'c0000000-0000-0000-0000-000000000028', '1999-02-18', 'Female', 'AB-', true, 'NTP-2025-11234', ARRAY['Eyes','Kidneys','Skin'], '8 Barnes Place, Colombo 07', 'Ravi Kumarasinghe', 'Parent', '+94776100028', 'default-images/58509055_9439726.jpg', 'Sri Lanka Insurance Corporation', 'SLIC-HI-2025-45678', 'Outpatient', '2029-11-30'),
  ('ce000000-0000-0000-0000-000000000029', 'c0000000-0000-0000-0000-000000000029', '1976-10-22', 'Male', 'O+', false, NULL, NULL, '117 Wijerama Mw, Colombo 07', 'Sriyani Pathirana', 'Spouse', '+94776100029', 'default-images/58509054_9441186.jpg', 'Allianz Insurance Lanka', 'ALZ-SL-2024-89012', 'Comprehensive', '2028-05-31'),
  ('ce000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000030', '1997-12-05', 'Female', 'A+', false, NULL, NULL, '44 Vajira Road, Colombo 04', 'Bandula Weerasekara', 'Parent', '+94776100030', 'default-images/58509051_9439729.jpg', 'Union Assurance', 'UA-HEALTH-2025-12345', 'Inpatient', '2029-04-30');

-- ============================================
-- NURSES (profiles)
-- ============================================

INSERT INTO nurses (user_id, license_number, department) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'SLNC-2017-1001', 'Emergency'),
  ('e0000000-0000-0000-0000-000000000002', 'SLNC-2018-1002', 'ICU'),
  ('e0000000-0000-0000-0000-000000000003', 'SLNC-2019-1003', 'Surgery'),
  ('e0000000-0000-0000-0000-000000000004', 'SLNC-2020-1004', 'Cardiology'),
  ('e0000000-0000-0000-0000-000000000005', 'SLNC-2021-1005', 'Neurology'),
  ('e0000000-0000-0000-0000-000000000006', 'SLNC-2022-1006', 'Pediatrics'),
  ('e0000000-0000-0000-0000-000000000007', 'SLNC-2018-1007', 'Orthopedics'),
  ('e0000000-0000-0000-0000-000000000008', 'SLNC-2023-1008', 'Dermatology'),
  ('e0000000-0000-0000-0000-000000000009', 'SLNC-2017-1009', 'Obstetrics & Gynecology'),
  ('e0000000-0000-0000-0000-000000000010', 'SLNC-2020-1010', 'Pulmonology');

-- ============================================
-- PHARMACISTS (profiles)
-- ============================================

INSERT INTO pharmacists (user_id, license_number) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'SLPC-2020-2001'),
  ('b0000000-0000-0000-0000-000000000002', 'SLPC-2021-2002'),
  ('b0000000-0000-0000-0000-000000000003', 'SLPC-2022-2003');

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
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '2 days') + TIME '09:30', 'scheduled', 'First cardiac consultation.'),
  ('ce000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000003', (CURRENT_DATE + INTERVAL '3 days') + TIME '14:00', 'scheduled', 'Sports injury follow-up.'),

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
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', (CURRENT_DATE - INTERVAL '5 days') + TIME '16:00', 'cancelled', 'Patient requested cancellation.'),

  -- Appointments for new patients with new doctors
  ('ce000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000005', (CURRENT_DATE - INTERVAL '18 days') + TIME '09:00', 'completed', 'Eczema follow-up. Skin improving.'),
  ('ce000000-0000-0000-0000-000000000008', 'dc000000-0000-0000-0000-000000000006', (CURRENT_DATE - INTERVAL '14 days') + TIME '10:30', 'completed', 'Routine gynecological checkup.'),
  ('ce000000-0000-0000-0000-000000000009', 'dc000000-0000-0000-0000-000000000007', (CURRENT_DATE - INTERVAL '12 days') + TIME '14:00', 'completed', 'Pre-operative assessment for appendectomy.'),
  ('ce000000-0000-0000-0000-000000000010', 'dc000000-0000-0000-0000-000000000008', (CURRENT_DATE - INTERVAL '10 days') + TIME '11:00', 'completed', 'Anxiety assessment and counseling session.'),
  ('ce000000-0000-0000-0000-000000000011', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '8 days') + TIME '09:30', 'completed', 'Chest pain evaluation. Stress test normal.'),
  ('ce000000-0000-0000-0000-000000000012', 'dc000000-0000-0000-0000-000000000005', (CURRENT_DATE - INTERVAL '6 days') + TIME '15:00', 'completed', 'Psoriasis initial consultation.'),
  ('ce000000-0000-0000-0000-000000000013', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE - INTERVAL '4 days') + TIME '10:00', 'completed', 'Migraine evaluation and treatment plan.'),
  ('ce000000-0000-0000-0000-000000000014', 'dc000000-0000-0000-0000-000000000006', (CURRENT_DATE - INTERVAL '3 days') + TIME '14:30', 'completed', 'Prenatal checkup. All vitals normal.'),

  -- Upcoming appointments for new patients
  ('ce000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000005', (CURRENT_DATE + INTERVAL '4 days') + TIME '09:00', 'scheduled', 'Dermatology follow-up for eczema.'),
  ('ce000000-0000-0000-0000-000000000009', 'dc000000-0000-0000-0000-000000000007', (CURRENT_DATE + INTERVAL '6 days') + TIME '08:00', 'scheduled', 'Post-surgery follow-up.'),
  ('ce000000-0000-0000-0000-000000000010', 'dc000000-0000-0000-0000-000000000008', (CURRENT_DATE + INTERVAL '8 days') + TIME '11:00', 'scheduled', 'Follow-up counseling session.'),
  ('ce000000-0000-0000-0000-000000000011', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '10 days') + TIME '09:30', 'scheduled', 'Cardiac follow-up.'),
  ('ce000000-0000-0000-0000-000000000013', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE + INTERVAL '12 days') + TIME '10:00', 'scheduled', 'Migraine treatment review.'),

  -- Today's appointments for new doctors
  ('ce000000-0000-0000-0000-000000000008', 'dc000000-0000-0000-0000-000000000005', CURRENT_DATE + TIME '09:00', 'completed', 'Morning dermatology consultation completed.'),
  ('ce000000-0000-0000-0000-000000000012', 'dc000000-0000-0000-0000-000000000005', CURRENT_DATE + TIME '11:30', 'in_progress', 'Psoriasis follow-up in progress.'),
  ('ce000000-0000-0000-0000-000000000014', 'dc000000-0000-0000-0000-000000000006', CURRENT_DATE + TIME '14:00', 'scheduled', 'Afternoon gynecology appointment.'),

  -- Appointments for newer patients with newer doctors
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000009', (CURRENT_DATE - INTERVAL '22 days') + TIME '09:00', 'completed', 'Chronic sinusitis evaluation. CT sinus ordered.'),
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011', (CURRENT_DATE - INTERVAL '16 days') + TIME '10:30', 'completed', 'COPD assessment. Spirometry performed.'),
  ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000010', (CURRENT_DATE - INTERVAL '20 days') + TIME '14:00', 'completed', 'Routine eye examination. Myopia detected.'),
  ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000012', (CURRENT_DATE - INTERVAL '11 days') + TIME '09:30', 'completed', 'Thyroid function assessment.'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000009', (CURRENT_DATE - INTERVAL '15 days') + TIME '11:00', 'completed', 'Tonsillitis follow-up. Improving.'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '7 days') + TIME '09:00', 'completed', 'Cardiac screening. Family history of heart disease.'),
  ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000010', (CURRENT_DATE - INTERVAL '9 days') + TIME '15:00', 'completed', 'Contact lens fitting and eye check.'),
  ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000008', (CURRENT_DATE - INTERVAL '5 days') + TIME '10:00', 'completed', 'Exam anxiety counseling session.'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '19 days') + TIME '08:30', 'completed', 'Coronary artery disease monitoring. Stable.'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000012', (CURRENT_DATE - INTERVAL '9 days') + TIME '11:00', 'completed', 'Type 2 diabetes management review.'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006', (CURRENT_DATE - INTERVAL '13 days') + TIME '14:30', 'completed', 'Polycystic ovary syndrome consultation.'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000011', (CURRENT_DATE - INTERVAL '6 days') + TIME '10:00', 'completed', 'Asthma assessment and management plan.'),

  -- More upcoming appointments
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011', (CURRENT_DATE + INTERVAL '3 days') + TIME '10:30', 'scheduled', 'COPD follow-up with spirometry.'),
  ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000012', (CURRENT_DATE + INTERVAL '5 days') + TIME '09:30', 'scheduled', 'Thyroid results review.'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000009', (CURRENT_DATE + INTERVAL '9 days') + TIME '11:00', 'scheduled', 'ENT follow-up.'),
  ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000008', (CURRENT_DATE + INTERVAL '7 days') + TIME '10:00', 'scheduled', 'Follow-up counseling session.'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '11 days') + TIME '08:30', 'scheduled', 'Quarterly cardiac monitoring.'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006', (CURRENT_DATE + INTERVAL '15 days') + TIME '14:30', 'scheduled', 'PCOS follow-up and hormone levels.'),

  -- More today's appointments
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000009', CURRENT_DATE + TIME '08:30', 'completed', 'Morning ENT consultation completed.'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', CURRENT_DATE + TIME '11:00', 'scheduled', 'Cardiac check scheduled for today.'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000009', CURRENT_DATE + TIME '14:00', 'scheduled', 'Afternoon ENT follow-up.'),

  -- Malith de Silva (gastroenterology via General Surgery)
  ('ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', (CURRENT_DATE - INTERVAL '17 days') + TIME '09:30', 'completed', 'Epigastric pain evaluation. Endoscopy recommended.'),
  ('ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', (CURRENT_DATE + INTERVAL '4 days') + TIME '09:30', 'scheduled', 'Post-endoscopy follow-up.'),

  -- Hiruni Rathnayake (ophthalmology + dermatology)
  ('ce000000-0000-0000-0000-000000000022', 'dc000000-0000-0000-0000-000000000010', (CURRENT_DATE - INTERVAL '14 days') + TIME '10:00', 'completed', 'Diabetic retinopathy screening.'),
  ('ce000000-0000-0000-0000-000000000022', 'dc000000-0000-0000-0000-000000000005', (CURRENT_DATE - INTERVAL '8 days') + TIME '14:30', 'completed', 'Diabetic skin complications evaluation.'),

  -- Buddhika Senanayake (cardiology + pulmonology)
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '20 days') + TIME '08:30', 'completed', 'Hypertension management review. BP controlled.'),
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000011', (CURRENT_DATE - INTERVAL '11 days') + TIME '11:00', 'completed', 'Chronic cough evaluation. Chest X-ray clear.'),
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '8 days') + TIME '08:30', 'scheduled', 'Quarterly BP review.'),

  -- Shanika de Soysa (gynecology + endocrinology)
  ('ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000006', (CURRENT_DATE - INTERVAL '13 days') + TIME '14:00', 'completed', 'Menstrual irregularity consultation.'),
  ('ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000012', (CURRENT_DATE - INTERVAL '6 days') + TIME '10:00', 'completed', 'Hormonal assessment for PCOS screening.'),
  ('ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000006', (CURRENT_DATE + INTERVAL '10 days') + TIME '14:00', 'scheduled', 'Follow-up with ultrasound results.'),

  -- Roshan Gunawardena (cardiology + ENT)
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE - INTERVAL '18 days') + TIME '09:00', 'completed', 'Post-MI cardiac rehabilitation check.'),
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000009', (CURRENT_DATE - INTERVAL '7 days') + TIME '15:00', 'completed', 'Hearing loss assessment.'),
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '12 days') + TIME '09:00', 'scheduled', 'Cardiac stress test follow-up.'),

  -- Imalka Jayathilaka (psychiatry + neurology)
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000008', (CURRENT_DATE - INTERVAL '15 days') + TIME '10:00', 'completed', 'Depression initial assessment.'),
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE - INTERVAL '5 days') + TIME '11:30', 'completed', 'Neurological screening for headaches.'),
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000008', (CURRENT_DATE + INTERVAL '6 days') + TIME '10:00', 'scheduled', 'Follow-up therapy session.'),

  -- Dilan Wijetunga (orthopedics + general surgery)
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000003', (CURRENT_DATE - INTERVAL '12 days') + TIME '14:00', 'completed', 'Lower back pain with sciatica evaluation.'),
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000007', (CURRENT_DATE - INTERVAL '4 days') + TIME '09:00', 'completed', 'Hernia assessment. Surgery recommended.'),
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000007', (CURRENT_DATE + INTERVAL '14 days') + TIME '08:00', 'scheduled', 'Pre-operative assessment for hernia repair.'),

  -- Nishadi Kumarasinghe (pediatrics + dermatology)
  ('ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000004', (CURRENT_DATE - INTERVAL '10 days') + TIME '10:30', 'completed', 'Childhood asthma management review.'),
  ('ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000005', (CURRENT_DATE - INTERVAL '3 days') + TIME '15:00', 'completed', 'Childhood eczema flare-up treatment.'),

  -- Chamika Pathirana (pulmonology + endocrinology)
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000011', (CURRENT_DATE - INTERVAL '16 days') + TIME '09:30', 'completed', 'Obstructive sleep apnea evaluation.'),
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000012', (CURRENT_DATE - INTERVAL '8 days') + TIME '11:00', 'completed', 'Metabolic syndrome assessment.'),
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000011', (CURRENT_DATE + INTERVAL '5 days') + TIME '09:30', 'scheduled', 'Sleep study results review.'),

  -- Thisari Weerasekara (neurology + ophthalmology)
  ('ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE - INTERVAL '9 days') + TIME '10:00', 'completed', 'Epilepsy medication review.'),
  ('ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000010', (CURRENT_DATE - INTERVAL '2 days') + TIME '14:00', 'completed', 'Visual field testing for epilepsy medication side effects.'),
  ('ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000002', (CURRENT_DATE + INTERVAL '9 days') + TIME '10:00', 'scheduled', 'Epilepsy follow-up with EEG.');

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
  ('ce000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Iron deficiency anemia', 'Dietary counseling: increase iron-rich foods (spinach, lentils, red meat). Take iron with vitamin C for better absorption. Avoid tea/coffee with meals. Repeat CBC in 6 weeks.', 'Hemoglobin 9.2 g/dL. Serum ferritin 8 ng/mL. MCV 72 fL (microcytic). No signs of GI bleeding. Menstrual history — heavy periods reported.'),
  ('ce000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000005', 'Atopic dermatitis (Eczema)', 'Topical corticosteroids for flare-ups. Emollient moisturizer twice daily. Avoid known irritants (harsh soaps, wool). Lukewarm baths only.', 'Bilateral antecubital fossae affected. Moderate eczema with lichenification. No secondary infection. Patch test negative for contact allergens.'),
  ('ce000000-0000-0000-0000-000000000008', 'dc000000-0000-0000-0000-000000000006', 'Normal gynecological examination', 'Annual screening recommended. Pap smear results pending. Continue current contraception.', 'Routine checkup. No abnormalities on physical examination. Breast exam normal. Last menstrual period regular.'),
  ('ce000000-0000-0000-0000-000000000009', 'dc000000-0000-0000-0000-000000000007', 'Acute appendicitis', 'Laparoscopic appendectomy performed successfully. Post-op recovery uneventful. Soft diet for 3 days, regular diet after. Follow-up in 2 weeks.', 'CT abdomen confirmed appendicitis. No perforation. Surgery completed in 45 minutes. Patient discharged day 2 post-op.'),
  ('ce000000-0000-0000-0000-000000000010', 'dc000000-0000-0000-0000-000000000008', 'Generalized anxiety disorder', 'Cognitive behavioral therapy (CBT) weekly sessions. Relaxation techniques: deep breathing, progressive muscle relaxation. Sleep hygiene education. Consider SSRI if symptoms persist.', 'GAD-7 score: 14 (moderate anxiety). No suicidal ideation. Good social support. Stressors: academic pressure, family concerns.'),
  ('ce000000-0000-0000-0000-000000000011', 'dc000000-0000-0000-0000-000000000001', 'Stable angina pectoris', 'GTN spray as needed for chest pain. Regular exercise within tolerance. Cardiac rehabilitation program. Annual stress test recommended.', 'Stress test: mild ST depression at stage 3. Echocardiogram: EF 60%. Coronary risk factors: age, hypertension, smoking history.'),
  ('ce000000-0000-0000-0000-000000000012', 'dc000000-0000-0000-0000-000000000005', 'Psoriasis vulgaris', 'Topical therapy: calcipotriol/betamethasone combination. Phototherapy referral if topical treatment insufficient. Moisturize daily. Avoid triggers: stress, alcohol, skin trauma.', 'Plaque psoriasis affecting elbows, knees, and scalp. PASI score 8.2 (moderate). Nail pitting present. No joint involvement.'),
  ('ce000000-0000-0000-0000-000000000013', 'dc000000-0000-0000-0000-000000000002', 'Migraine with aura', 'Prophylactic treatment: topiramate 25mg daily. Acute: sumatriptan 50mg as needed. Headache diary to track frequency and triggers. Avoid known triggers.', 'Migraine frequency 5-6/month with visual aura (scintillating scotoma). Duration 6-18 hours. CT brain normal. Family history positive.'),
  ('ce000000-0000-0000-0000-000000000014', 'dc000000-0000-0000-0000-000000000006', 'Normal first trimester pregnancy', 'Prenatal vitamins: folic acid 5mg daily. Iron supplementation. First trimester screening scheduled. Avoid alcohol, smoking. Next visit in 4 weeks.', 'Gestational age 10 weeks by LMP. Ultrasound confirms single viable intrauterine pregnancy. FHR 160 bpm. No vaginal bleeding.'),
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000009', 'Chronic rhinosinusitis', 'Nasal corticosteroid spray daily. Saline nasal irrigation twice daily. Avoid known allergens. Consider endoscopic sinus surgery if medical therapy fails after 3 months.', 'CT sinus: bilateral maxillary and ethmoid sinus opacification. Nasal polyps grade II. Anterior rhinoscopy confirms mucosal edema.'),
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011', 'Chronic obstructive pulmonary disease (COPD)', 'Smoking cessation essential. Tiotropium inhaler daily. Pulmonary rehabilitation referral. Influenza and pneumococcal vaccination. Avoid dust and fumes.', 'Spirometry: FEV1/FVC 0.62, FEV1 58% predicted. 30 pack-year smoking history. Mild barrel chest. Decreased breath sounds bilaterally.'),
  ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000010', 'Myopia (moderate)', 'Corrective lenses prescribed: -3.50 D (R), -3.25 D (L). Annual eye exam recommended. Discuss LASIK candidacy at next visit. Limit prolonged screen time.', 'Visual acuity 6/36 both eyes uncorrected, corrected to 6/6 with lenses. Fundoscopy: no retinal pathology. IOP 14 mmHg bilaterally.'),
  ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000012', 'Subclinical hypothyroidism', 'Monitor TSH every 3 months. Low-dose levothyroxine if TSH rises above 10. Iodine-rich diet encouraged. Repeat thyroid antibodies in 6 months.', 'TSH 6.8 mIU/L (elevated), Free T4 normal at 14 pmol/L. Anti-TPO antibodies mildly elevated. No palpable goitre. Asymptomatic currently.'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000009', 'Acute tonsillitis', 'Amoxicillin 500mg TDS for 10 days. Paracetamol for pain. Warm saline gargles. Soft diet. Adequate fluid intake. Rest for 3-5 days.', 'Bilateral tonsillar enlargement grade 3 with exudate. No peritonsillar abscess. Throat swab sent for culture. Temperature 38.5°C. Rapid strep positive.'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000001', 'Normal cardiac screening', 'No intervention needed. Annual cardiac screening recommended given family history. Maintain healthy lifestyle. Regular exercise 150 min/week.', 'ECG normal sinus rhythm. Echocardiogram: EF 65%, no structural abnormalities. Lipid panel within normal limits. Family history: father — MI at age 52.'),
  ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000010', 'Myopia (mild) with astigmatism', 'Corrective lenses: -1.25/-0.75 x 180 (R), -1.00/-0.50 x 175 (L). Blue-light filtering lenses recommended for screen use. Follow-up in 12 months.', 'Visual acuity 6/12 both eyes. Autorefraction confirms mild myopia with astigmatism. No other ocular pathology. Student with heavy screen usage.'),
  ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000008', 'Adjustment disorder with anxiety', 'CBT sessions weekly. Mindfulness and breathing exercises. Academic accommodation letter provided. Sleep hygiene counseling. Review in 4 weeks.', 'GAD-7 score 11 (moderate). PHQ-9 score 6 (mild). Stressor: university exams and relocation. Good insight. No self-harm ideation.'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', 'Coronary artery disease (stable)', 'Dual antiplatelet therapy. Statin therapy. GTN spray PRN. Cardiac rehabilitation. Stress management. Annual stress test. Avoid overexertion.', 'Prior PCI with stent to LAD (2024). Current stress test: no new ischaemia. EF 50%. Risk factors: age, smoking (quit 2024), diabetes, hypertension.'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000012', 'Type 2 Diabetes Mellitus (poorly controlled)', 'Intensify insulin regimen: add basal insulin. Continue metformin. SMBG four times daily. Diabetic diet reinforcement. Quarterly HbA1c. Annual eye and foot screening.', 'HbA1c 9.1% (target <7%). Fasting glucose 198 mg/dL. On maximal oral hypoglycaemics. Diabetic retinopathy screening due. No diabetic foot ulcers.'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006', 'Polycystic ovary syndrome (PCOS)', 'Combined OCP for cycle regulation. Metformin 500mg BD for insulin resistance. Weight management counseling. Anti-androgen therapy if hirsutism worsens.', 'Ultrasound: bilateral polycystic ovaries (>12 follicles each). Testosterone mildly elevated. LH:FSH ratio 3:1. BMI 28.6. Irregular cycles since menarche.'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000011', 'Mild persistent asthma', 'Low-dose ICS (budesonide 200mcg BD). SABA PRN. Peak flow diary. Avoid triggers: dust, smoke, cold air. Annual review.', 'Spirometry: FEV1 82% predicted, reversibility +14%. Nocturnal symptoms 1-2x/week. Daytime symptoms 3x/week. No ER visits in past year.'),
  -- Malith de Silva
  ('ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', 'Gastric ulcer (H. pylori positive)', 'Triple therapy: PPI + clarithromycin + amoxicillin for 14 days. Avoid NSAIDs, alcohol, and spicy food. Repeat endoscopy in 8 weeks.', 'Upper GI endoscopy: 1.5cm ulcer in gastric antrum. CLO test positive for H. pylori. No malignant features on biopsy.'),
  -- Hiruni Rathnayake
  ('ce000000-0000-0000-0000-000000000022', 'dc000000-0000-0000-0000-000000000010', 'Non-proliferative diabetic retinopathy (mild)', 'Optimise glycaemic control. Annual dilated eye exam. No laser treatment needed currently. Refer endocrinology for HbA1c management.', 'Dilated fundoscopy: scattered microaneurysms and dot haemorrhages in both eyes. No macular oedema. Visual acuity 6/9 bilaterally.'),
  ('ce000000-0000-0000-0000-000000000022', 'dc000000-0000-0000-0000-000000000005', 'Necrobiosis lipoidica diabeticorum', 'Topical clobetasol propionate for active lesions. Emollient moisturiser. Optimise diabetes control. Monitor for ulceration.', 'Yellowish-brown atrophic plaques on bilateral shins. Characteristic of diabetic dermopathy. No ulceration. Skin biopsy confirms diagnosis.'),
  -- Buddhika Senanayake
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000001', 'Essential hypertension (well controlled)', 'Continue current antihypertensives. DASH diet adherence. Home BP monitoring twice daily. Annual renal function and electrolytes.', 'BP 128/82 on treatment. Renal function normal. No proteinuria. ECG: normal sinus rhythm with mild LVH. Compliant with medications.'),
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000011', 'Chronic cough — post-nasal drip syndrome', 'Intranasal corticosteroid. Antihistamine trial. Avoid known allergens. Chest X-ray clear — no pulmonary cause. ENT referral if persistent.', 'Chronic cough for 3 months. Non-productive. Worse at night and lying down. CXR normal. Spirometry normal. Likely upper airway cough syndrome.'),
  -- Shanika de Soysa
  ('ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000006', 'Oligomenorrhoea under investigation', 'Hormone panel and pelvic ultrasound ordered. Lifestyle modifications: weight management, stress reduction. Follow-up with results.', 'Irregular cycles — 45-60 day intervals since age 18. No galactorrhoea. Mild acne. BMI 26.2. Thyroid exam normal. Rule out PCOS.'),
  ('ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000012', 'Insulin resistance (pre-diabetes)', 'Metformin 500mg OD. OGTT in 3 months. Low glycaemic index diet. Exercise 150 min/week. Weight loss target 5-7% body weight.', 'Fasting glucose 110 mg/dL. Fasting insulin 22 mU/L (elevated). HOMA-IR 5.9. HbA1c 5.9% (pre-diabetic). Acanthosis nigricans on neck.'),
  -- Roshan Gunawardena
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', 'Post-MI rehabilitation (stable)', 'Phase III cardiac rehab. Supervised exercise. Psychological screening. Medication compliance review. Annual stress test.', 'MI 8 months ago. PCI to RCA with DES. EF 48%. On DAPT, statin, ACE inhibitor, beta-blocker. Exercise tolerance improving. No angina.'),
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000009', 'Age-related sensorineural hearing loss (bilateral)', 'Hearing aids recommended. Annual audiometry. Avoid noise exposure. Communication strategies counselling.', 'Pure tone audiometry: bilateral moderate sensorineural hearing loss (PTA 45dB). Speech discrimination 72% (R), 68% (L). Tympanometry normal.'),
  -- Imalka Jayathilaka
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000008', 'Major depressive disorder (moderate)', 'SSRI initiated. CBT weekly sessions. Social activity encouragement. Safety plan discussed. Follow-up in 2 weeks to assess SSRI response.', 'PHQ-9 score 16 (moderately severe). Symptoms for 4 months: low mood, anhedonia, fatigue, insomnia, poor concentration. No suicidal ideation. Good social support.'),
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000002', 'Tension-type headache', 'Stress management techniques. Regular sleep schedule. Limit screen time. Ergonomic assessment. Paracetamol PRN for acute episodes.', 'Bilateral non-pulsatile headache. Frequency 3-4/week. Duration 4-6 hours. No photophobia or nausea. CT brain normal. Likely stress-related.'),
  -- Dilan Wijetunga
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000003', 'Lumbar disc prolapse (L5-S1) with radiculopathy', 'Conservative management: physiotherapy, NSAIDs, nerve root block if no improvement. Avoid heavy lifting. MRI in 6 weeks if symptoms persist.', 'MRI lumbar: L5-S1 posterolateral disc prolapse with S1 nerve root compression. Positive straight leg raise at 40°. Ankle reflex diminished on right.'),
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000007', 'Right inguinal hernia', 'Elective laparoscopic hernia repair recommended. Pre-operative blood work and ECG. Avoid straining and heavy lifting pre-op.', 'Reducible right inguinal hernia. No signs of obstruction or strangulation. Cough impulse positive. BMI 31.2 — weight loss advised pre-operatively.'),
  -- Nishadi Kumarasinghe
  ('ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000004', 'Childhood asthma (well-controlled)', 'Continue low-dose ICS. SABA PRN. Spacer device technique review. Annual flu vaccination. Avoid triggers: pets, cold air, exercise without warm-up.', 'Age 27 but diagnosed in childhood. Currently on budesonide 100mcg BD. No ER visits this year. PEF >85% predicted. ACT score 22/25.'),
  ('ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000005', 'Atopic dermatitis flare-up', 'Topical mometasone furoate for 1 week then step down to emollient. Antihistamine for itch. Identify and avoid trigger. Wet wraps if severe.', 'Acute eczema flare bilateral popliteal fossae and wrists. Erythema, vesicles, excoriation. Triggered by change in laundry detergent.'),
  -- Chamika Pathirana
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000011', 'Obstructive sleep apnoea (moderate)', 'CPAP therapy initiated. Weight management — target BMI <30. Sleep hygiene counselling. Avoid alcohol and sedatives. Follow-up in 4 weeks.', 'Sleep study (PSG): AHI 22/hour (moderate). Lowest SpO2 78%. BMI 33.5. Epworth Sleepiness Scale 14/24. Neck circumference 44cm.'),
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000012', 'Metabolic syndrome', 'Lifestyle modifications priority: calorie restriction, exercise 300 min/week. Metformin for insulin resistance. Statin for dyslipidaemia. Quarterly review.', 'Waist circumference 108cm. TG 210 mg/dL. HDL 32 mg/dL. FBG 118 mg/dL. BP 142/88. Meets 4 of 5 criteria for metabolic syndrome.'),
  -- Thisari Weerasekara
  ('ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000002', 'Focal epilepsy (well-controlled)', 'Continue levetiracetam. Seizure diary. Driving restrictions counselling. Annual EEG. Avoid sleep deprivation and excess alcohol.', 'Seizure-free for 18 months on levetiracetam 500mg BD. EEG: occasional left temporal spikes. MRI brain: no structural lesion. Side effects: mild fatigue.'),
  ('ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000010', 'Normal visual field assessment', 'No visual field defect detected. Continue current epilepsy medication. Annual visual field screening recommended.', 'Humphrey visual field test: full fields bilaterally. No constriction or scotomata. Performed to monitor levetiracetam/vigabatrin effects.');

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
  ('ce000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000003', 'Tramadol', '50mg', 'Twice daily', '1 week', 'cancelled'),

  -- New patient prescriptions
  ('ce000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000005', 'Hydrocortisone Cream', '1% topical', 'Twice daily (affected areas)', '2 weeks', 'active'),
  ('ce000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000005', 'Cetirizine', '10mg', 'Once daily', '1 month', 'active'),
  ('ce000000-0000-0000-0000-000000000009', 'dc000000-0000-0000-0000-000000000007', 'Cefuroxime', '500mg', 'Twice daily', '5 days', 'dispensed'),
  ('ce000000-0000-0000-0000-000000000010', 'dc000000-0000-0000-0000-000000000008', 'Sertraline', '50mg', 'Once daily (morning)', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000011', 'dc000000-0000-0000-0000-000000000001', 'Glyceryl Trinitrate Spray', '400mcg', 'As needed (sublingual)', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000011', 'dc000000-0000-0000-0000-000000000001', 'Bisoprolol', '5mg', 'Once daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000012', 'dc000000-0000-0000-0000-000000000005', 'Calcipotriol/Betamethasone', '50mcg/0.5mg', 'Once daily (affected areas)', '4 weeks', 'active'),
  ('ce000000-0000-0000-0000-000000000013', 'dc000000-0000-0000-0000-000000000002', 'Topiramate', '25mg', 'Once daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000014', 'dc000000-0000-0000-0000-000000000006', 'Folic Acid', '5mg', 'Once daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000009', 'Fluticasone Nasal Spray', '50mcg', 'Two sprays each nostril daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011', 'Tiotropium Inhaler', '18mcg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011', 'Salbutamol Inhaler', '100mcg', '2 puffs PRN', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000009', 'Amoxicillin', '500mg', 'Three times daily', '10 days', 'dispensed'),
  ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000008', 'Hydroxyzine', '25mg', 'At bedtime as needed', '1 month', 'active'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', 'Aspirin', '75mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', 'Atorvastatin', '40mg', 'Once daily (bedtime)', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', 'Clopidogrel', '75mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000012', 'Insulin Glargine', '20 units', 'Once daily (bedtime)', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000012', 'Metformin', '1000mg', 'Twice daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006', 'Combined OCP (Yasmin)', '1 tablet', 'Once daily', '6 months', 'active'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006', 'Metformin', '500mg', 'Twice daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000011', 'Budesonide Inhaler', '200mcg', 'Twice daily', '6 months', 'active'),
  -- Malith de Silva
  ('ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', 'Esomeprazole', '40mg', 'Twice daily', '14 days', 'active'),
  ('ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', 'Clarithromycin', '500mg', 'Twice daily', '14 days', 'active'),
  ('ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', 'Amoxicillin', '1000mg', 'Twice daily', '14 days', 'active'),
  -- Hiruni Rathnayake
  ('ce000000-0000-0000-0000-000000000022', 'dc000000-0000-0000-0000-000000000005', 'Clobetasol Propionate Cream', '0.05%', 'Once daily (affected areas)', '2 weeks', 'active'),
  -- Buddhika Senanayake
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000001', 'Enalapril', '10mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000001', 'Hydrochlorothiazide', '12.5mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000011', 'Fluticasone Nasal Spray', '50mcg', 'Two sprays each nostril daily', '1 month', 'active'),
  -- Shanika de Soysa
  ('ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000012', 'Metformin', '500mg', 'Once daily', '3 months', 'active'),
  -- Roshan Gunawardena
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', 'Ramipril', '5mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', 'Bisoprolol', '5mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', 'Aspirin', '75mg', 'Once daily', 'Ongoing', 'active'),
  ('ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000001', 'Atorvastatin', '80mg', 'Once daily (bedtime)', 'Ongoing', 'active'),
  -- Imalka Jayathilaka
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000008', 'Escitalopram', '10mg', 'Once daily (morning)', '6 months', 'active'),
  ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000002', 'Paracetamol', '500mg', 'As needed (max 4x daily)', '1 month', 'active'),
  -- Dilan Wijetunga
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000003', 'Pregabalin', '75mg', 'Twice daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000003', 'Diclofenac', '50mg', 'Three times daily (after meals)', '2 weeks', 'dispensed'),
  -- Nishadi Kumarasinghe
  ('ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000005', 'Mometasone Furoate Cream', '0.1%', 'Once daily (affected areas)', '1 week', 'active'),
  ('ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000004', 'Montelukast', '10mg', 'Once daily (bedtime)', '3 months', 'active'),
  -- Chamika Pathirana
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000012', 'Metformin', '500mg', 'Twice daily', '3 months', 'active'),
  ('ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000012', 'Rosuvastatin', '10mg', 'Once daily (bedtime)', '6 months', 'active'),
  -- Thisari Weerasekara
  ('ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000002', 'Levetiracetam', '500mg', 'Twice daily', 'Ongoing', 'active');

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
  ('ce000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'MRI Left Knee', 'Partial tear of anterior cruciate ligament (Grade 2). Mild joint effusion. Menisci intact.', 'ACL partially torn. No meniscal damage. Conservative management may be appropriate.', (CURRENT_DATE - INTERVAL '5 days') + TIME '13:30'),
  ('ce000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', 'CT Paranasal Sinuses', 'Bilateral maxillary and ethmoid sinus opacification. Nasal polyps grade II. Deviated nasal septum to right.', 'Chronic sinusitis confirmed. Correlate with clinical findings.', (CURRENT_DATE - INTERVAL '21 days') + TIME '10:00'),
  ('ce000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'Spirometry', 'FEV1/FVC 0.62, FEV1 58% predicted. No significant bronchodilator response (+8%).', 'Obstructive pattern consistent with COPD. GOLD Stage II.', (CURRENT_DATE - INTERVAL '15 days') + TIME '09:30'),
  ('ce000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000004', 'Thyroid Function Tests', 'TSH: 6.8 mIU/L (H), Free T4: 14 pmol/L (N), Free T3: 4.2 pmol/L (N), Anti-TPO: 85 IU/mL (H)', 'Subclinical hypothyroidism with positive anti-TPO. Monitor TSH in 3 months.', (CURRENT_DATE - INTERVAL '10 days') + TIME '08:45'),
  ('ce000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000002', 'Pelvic Ultrasound', 'Bilateral polycystic ovaries with >12 follicles each. Uterus normal size. Endometrium 6mm.', 'Findings consistent with PCOS. Clinical correlation recommended.', (CURRENT_DATE - INTERVAL '12 days') + TIME '14:00'),
  ('ce000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000003', 'Throat Swab Culture', 'Group A Streptococcus (GAS) isolated. Sensitive to penicillin, amoxicillin, erythromycin.', 'Positive strep culture. Continue prescribed antibiotics.', (CURRENT_DATE - INTERVAL '14 days') + TIME '11:30'),
  ('ce000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', 'Lipid Panel', 'Total Cholesterol: 195 mg/dL, LDL: 115 mg/dL, HDL: 62 mg/dL, Triglycerides: 98 mg/dL', 'All values within normal range. Continue healthy lifestyle.', (CURRENT_DATE - INTERVAL '6 days') + TIME '09:00'),
  ('ce000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000004', 'Visual Acuity Test', 'OD: 6/12, OS: 6/12. With correction: 6/6 both eyes. IOP: 14/15 mmHg.', 'Mild myopia with astigmatism. No glaucoma risk.', (CURRENT_DATE - INTERVAL '8 days') + TIME '15:30'),
  ('ce000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001', 'HbA1c', 'HbA1c: 9.1% (Target <7%)', 'Poorly controlled diabetes. Intensification of therapy recommended.', (CURRENT_DATE - INTERVAL '8 days') + TIME '08:15'),
  ('ce000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000002', 'Cardiac Stress Test', 'No new ST segment changes. Achieved 85% MPHR. No exercise-induced arrhythmia. Duke treadmill score: +5 (low risk).', 'Stable coronary artery disease. No new ischaemia.', (CURRENT_DATE - INTERVAL '18 days') + TIME '10:30'),
  ('ce000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000003', 'Renal Function Panel', 'Creatinine: 1.1 mg/dL, BUN: 18 mg/dL, eGFR: 78 mL/min, Na: 140, K: 4.2', 'Mildly reduced eGFR. Monitor annually given diabetes and cardiac history.', (CURRENT_DATE - INTERVAL '8 days') + TIME '09:00'),
  ('ce000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000002', 'Hormone Panel', 'Testosterone: 68 ng/dL (H), DHEA-S: 380 mcg/dL (H), LH: 12.5 mIU/mL, FSH: 4.1 mIU/mL', 'LH:FSH ratio >2:1. Elevated androgens. Consistent with PCOS.', (CURRENT_DATE - INTERVAL '12 days') + TIME '11:00'),
  ('ce000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000004', 'Spirometry', 'FEV1/FVC 0.78, FEV1 82% predicted. Bronchodilator reversibility +14%.', 'Mild obstructive pattern with significant reversibility. Consistent with asthma.', (CURRENT_DATE - INTERVAL '5 days') + TIME '10:15'),
  ('ce000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', 'Upper GI Endoscopy + Biopsy', 'Gastric antral ulcer 1.5cm. CLO test positive. Biopsy: chronic active gastritis with H. pylori.', 'No malignancy. H. pylori eradication therapy recommended.', (CURRENT_DATE - INTERVAL '16 days') + TIME '11:00'),
  ('ce000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000003', 'Fundus Photography + OCT', 'Scattered microaneurysms both eyes. No macular oedema on OCT. Retinal thickness normal.', 'Mild NPDR. Annual screening recommended.', (CURRENT_DATE - INTERVAL '13 days') + TIME '09:30'),
  ('ce000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000002', 'HbA1c', 'HbA1c: 8.4% (Target <7%)', 'Suboptimal glycaemic control. Therapy intensification advised.', (CURRENT_DATE - INTERVAL '13 days') + TIME '08:00'),
  ('ce000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000004', 'Renal Function + Electrolytes', 'Creatinine: 0.9 mg/dL, eGFR: 92, Na: 141, K: 4.0, BUN: 15', 'Normal renal function. Continue current antihypertensives.', (CURRENT_DATE - INTERVAL '19 days') + TIME '08:30'),
  ('ce000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', 'Chest X-Ray (PA)', 'Heart size upper limit normal. Lung fields clear. No consolidation or effusion.', 'Normal CXR. Mild cardiomegaly — correlate with echocardiogram.', (CURRENT_DATE - INTERVAL '10 days') + TIME '10:00'),
  ('ce000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000003', 'Hormone Panel (Female)', 'LH: 11.8, FSH: 4.0, Testosterone: 58 ng/dL (H), DHEA-S: 340 (H), Prolactin: 12', 'Elevated androgens with LH:FSH >2:1. Suggestive of PCOS.', (CURRENT_DATE - INTERVAL '5 days') + TIME '09:00'),
  ('ce000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000004', 'OGTT (75g Glucose)', 'Fasting: 110 mg/dL. 1hr: 195 mg/dL. 2hr: 155 mg/dL.', 'Impaired glucose tolerance. Pre-diabetic range.', (CURRENT_DATE - INTERVAL '5 days') + TIME '11:30'),
  ('ce000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001', 'Echocardiogram', 'EF 48%. Mild hypokinesia inferior wall. No significant valvular disease. Normal LV dimensions.', 'Mildly reduced EF. Consistent with post-MI changes. Stable.', (CURRENT_DATE - INTERVAL '17 days') + TIME '14:00'),
  ('ce000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000002', 'Audiometry (Pure Tone)', 'PTA: R 45dB, L 48dB. Bilateral moderate sensorineural hearing loss. Air-bone gap absent.', 'Age-related hearing loss. Hearing aids recommended.', (CURRENT_DATE - INTERVAL '6 days') + TIME '10:30'),
  ('ce000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000003', 'MRI Lumbar Spine', 'L5-S1 posterolateral disc prolapse with right S1 nerve root compression. No cauda equina. No spinal stenosis.', 'Correlate clinically. Conservative management first-line.', (CURRENT_DATE - INTERVAL '11 days') + TIME '13:00'),
  ('ce000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000004', 'Polysomnography (Sleep Study)', 'AHI: 22/hr. Lowest SpO2: 78%. Total sleep time: 5.8 hrs. Sleep efficiency: 72%. REM-related events predominant.', 'Moderate OSA. CPAP titration recommended.', (CURRENT_DATE - INTERVAL '15 days') + TIME '06:30'),
  ('ce000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000001', 'Lipid Panel + Fasting Glucose', 'Total Chol: 265, TG: 210, HDL: 32, LDL: 191, FBG: 118 mg/dL', 'Dyslipidaemia with impaired fasting glucose. Metabolic syndrome criteria met.', (CURRENT_DATE - INTERVAL '7 days') + TIME '08:00'),
  ('ce000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000002', 'EEG (Routine)', 'Background: normal alpha rhythm. Occasional left temporal sharp waves. No electrographic seizures captured.', 'Interictal epileptiform discharges. Consistent with focal epilepsy.', (CURRENT_DATE - INTERVAL '8 days') + TIME '09:45'),
  ('ce000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000003', 'Humphrey Visual Field Test', 'Full visual fields bilaterally. MD: -0.8 dB (R), -1.1 dB (L). No scotomata. Pattern deviation normal.', 'No visual field defect. Repeat annually while on AEDs.', (CURRENT_DATE - INTERVAL '1 day') + TIME '14:30');

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
  ('ce000000-0000-0000-0000-000000000006', 'Codeine', 'mild', 'Nausea and mild itching', '2023-05-30'),
  ('ce000000-0000-0000-0000-000000000007', 'Dust Mites', 'moderate', 'Eczema flare-up, skin irritation', '2019-06-15'),
  ('ce000000-0000-0000-0000-000000000009', 'Amoxicillin', 'moderate', 'Skin rash and hives', '2020-08-10'),
  ('ce000000-0000-0000-0000-000000000011', 'Metformin', 'mild', 'Gastrointestinal discomfort', '2022-04-20'),
  ('ce000000-0000-0000-0000-000000000012', 'Erythromycin', 'moderate', 'Nausea and abdominal cramps', '2021-11-08'),
  ('ce000000-0000-0000-0000-000000000013', 'Morphine', 'severe', 'Respiratory depression risk — documented', '2018-03-25'),
  ('ce000000-0000-0000-0000-000000000014', 'Tetracycline', 'mild', 'Photosensitivity reaction', '2023-09-14'),
  ('ce000000-0000-0000-0000-000000000015', 'ACE Inhibitors', 'moderate', 'Persistent dry cough and angioedema risk', '2019-02-10'),
  ('ce000000-0000-0000-0000-000000000015', 'Ciprofloxacin', 'mild', 'Tendon pain in ankles', '2021-07-18'),
  ('ce000000-0000-0000-0000-000000000017', 'Peanuts', 'severe', 'Anaphylaxis — carries EpiPen', '2015-05-20'),
  ('ce000000-0000-0000-0000-000000000018', 'Cats', 'mild', 'Sneezing, watery eyes, nasal congestion', '2018-09-01'),
  ('ce000000-0000-0000-0000-000000000019', 'Metformin', 'mild', 'GI upset — tolerated at lower dose', '2020-03-15'),
  ('ce000000-0000-0000-0000-000000000019', 'Contrast Dye', 'moderate', 'Urticaria and mild bronchospasm — premedicate', '2024-01-20'),
  ('ce000000-0000-0000-0000-000000000020', 'Sulfonamides', 'moderate', 'Skin rash and facial swelling', '2022-06-30'),
  ('ce000000-0000-0000-0000-000000000021', 'Metoclopramide', 'moderate', 'Extrapyramidal side effects — dystonia', '2021-04-18'),
  ('ce000000-0000-0000-0000-000000000022', 'Bee Stings', 'severe', 'Anaphylaxis — carries EpiPen', '2016-08-12'),
  ('ce000000-0000-0000-0000-000000000022', 'Sulfa Drugs', 'moderate', 'Skin rash', '2019-11-20'),
  ('ce000000-0000-0000-0000-000000000023', 'Lisinopril', 'moderate', 'Dry persistent cough and angioedema', '2020-05-10'),
  ('ce000000-0000-0000-0000-000000000025', 'Clopidogrel', 'mild', 'Excessive bruising', '2025-08-15'),
  ('ce000000-0000-0000-0000-000000000026', 'Fluoxetine', 'moderate', 'Severe nausea and insomnia', '2023-12-01'),
  ('ce000000-0000-0000-0000-000000000027', 'Tramadol', 'severe', 'Seizure risk — documented prior episode', '2019-07-22'),
  ('ce000000-0000-0000-0000-000000000028', 'Wool', 'mild', 'Eczema flare-up on contact', '2015-03-10'),
  ('ce000000-0000-0000-0000-000000000028', 'House Dust', 'moderate', 'Asthma exacerbation and rhinitis', '2014-06-20'),
  ('ce000000-0000-0000-0000-000000000029', 'Shellfish', 'moderate', 'Urticaria and lip swelling', '2017-01-30'),
  ('ce000000-0000-0000-0000-000000000030', 'Carbamazepine', 'severe', 'Stevens-Johnson syndrome risk — HLA-B*1502 positive', '2020-09-15');

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

-- Arjuna Ranatunga requests refill for Atorvastatin (approved)
INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, doctor_note, responded_at, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'approved',
       'Need to continue statin therapy as prescribed.',
       'Approved. Continue 40mg daily.',
       NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 days'
FROM prescriptions rx
WHERE rx.medication = 'Atorvastatin' AND rx.patient_id = 'ce000000-0000-0000-0000-000000000019' AND rx.status = 'active'
LIMIT 1;

-- Sewwandi Liyanage requests refill for Combined OCP (pending)
INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'pending',
       'Running out of oral contraceptive pills. Need refill before next cycle.',
       NOW() - INTERVAL '8 hours'
FROM prescriptions rx
WHERE rx.medication = 'Combined OCP (Yasmin)' AND rx.status = 'active'
LIMIT 1;

-- Janaka Herath requests refill for Tiotropium (pending)
INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'pending',
       'Inhaler is almost empty. Need a new one.',
       NOW() - INTERVAL '4 hours'
FROM prescriptions rx
WHERE rx.medication = 'Tiotropium Inhaler' AND rx.status = 'active'
LIMIT 1;

-- Chaminda Bandara requests refill for GTN spray (approved)
INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, status, reason, doctor_note, responded_at, created_at)
SELECT rx.id, rx.patient_id, rx.doctor_id, 'approved',
       'My GTN spray expired. Need a new one for emergencies.',
       'Approved. Always carry spray. Seek emergency care if chest pain persists after 3 doses.',
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 days'
FROM prescriptions rx
WHERE rx.medication = 'Glyceryl Trinitrate Spray' AND rx.status = 'active'
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
  ('c0000000-0000-0000-0000-000000000001', 'appointment_scheduled', 'Appointment Scheduled', 'Your appointment with Dr. Kamal Perera has been scheduled.', true, NULL, 'appointment', NOW() - INTERVAL '30 days'),
  ('c0000000-0000-0000-0000-000000000001', 'medical_record_created', 'New Medical Record', 'Dr. Kamal Perera added a new record: Mild hypertension (Stage 1).', true, NULL, 'medical_record', NOW() - INTERVAL '29 days'),
  ('c0000000-0000-0000-0000-000000000001', 'prescription_created', 'New Prescription', 'Dr. Kamal Perera prescribed Amlodipine 5mg.', true, NULL, 'prescription', NOW() - INTERVAL '29 days'),
  ('c0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'Your Complete Blood Count (CBC) results are now available.', true, NULL, 'lab_report', NOW() - INTERVAL '28 days'),
  ('c0000000-0000-0000-0000-000000000001', 'lab_report_ready', 'Lab Report Ready', 'Your Lipid Panel results are now available.', false, NULL, 'lab_report', NOW() - INTERVAL '28 days'),
  ('c0000000-0000-0000-0000-000000000001', 'appointment_scheduled', 'Appointment Scheduled', 'Your quarterly cardiac review with Dr. Kamal Perera has been scheduled.', false, NULL, 'appointment', NOW() - INTERVAL '2 days'),
  ('c0000000-0000-0000-0000-000000000001', 'refill_approved', 'Refill Approved', 'Your refill request for Amlodipine has been approved.', true, NULL, 'refill_request', NOW() - INTERVAL '15 days'),

  -- Patient Dinesh Rajapaksa: neurology notifications
  ('c0000000-0000-0000-0000-000000000002', 'appointment_scheduled', 'Appointment Scheduled', 'Your appointment with Dr. Sithara Silva has been scheduled.', true, NULL, 'appointment', NOW() - INTERVAL '26 days'),
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
  ('c0000000-0000-0000-0000-000000000005', 'appointment_scheduled', 'Appointment Scheduled', 'Your appointment with Dr. Kamal Perera has been scheduled.', false, NULL, 'appointment', NOW() - INTERVAL '1 day'),
  ('c0000000-0000-0000-0000-000000000005', 'appointment_cancelled', 'Appointment Cancelled', 'Your appointment with Dr. Anjali Dissanayake has been cancelled.', true, NULL, 'appointment', NOW() - INTERVAL '5 days'),

  -- Patient Lahiru Gunasekara: sports injury notifications
  ('c0000000-0000-0000-0000-000000000006', 'lab_report_ready', 'Lab Report Ready', 'Your MRI Left Knee results are now available.', false, NULL, 'lab_report', NOW() - INTERVAL '5 days'),
  ('c0000000-0000-0000-0000-000000000006', 'medical_record_created', 'New Medical Record', 'Dr. Ruwan Fernando added a new record: ACL sprain (Grade 2).', false, NULL, 'medical_record', NOW() - INTERVAL '4 days'),
  ('c0000000-0000-0000-0000-000000000006', 'appointment_scheduled', 'Appointment Scheduled', 'Your follow-up with Dr. Ruwan Fernando has been scheduled.', false, NULL, 'appointment', NOW() - INTERVAL '1 day'),

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
  ('ce000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', 'Tetanus (Td)', 1, 'TD2026-01', 'Sanofi', 'Right deltoid', '2026-02-15', '2026-02-15', NULL, 'completed', 'Booster after sports injury.', NOW() - INTERVAL '24 days'),

  -- Janaka Herath
  ('ce000000-0000-0000-0000-000000000015', 'e0000000-0000-0000-0000-000000000004', 'Influenza (Seasonal)', 1, 'FLU2026-08', 'Seqirus', 'Left deltoid', '2026-01-20', '2026-01-20', NULL, 'completed', 'Annual flu shot. Important for COPD patient.', NOW() - INTERVAL '50 days'),
  ('ce000000-0000-0000-0000-000000000015', 'e0000000-0000-0000-0000-000000000004', 'Pneumococcal (PPSV23)', 1, 'PV2025-15', 'Merck', 'Left deltoid', '2025-10-01', '2025-10-01', NULL, 'completed', 'Indicated for COPD. One-time dose.', NOW() - INTERVAL '160 days'),

  -- Tharindu Wijesinghe
  ('ce000000-0000-0000-0000-000000000017', 'e0000000-0000-0000-0000-000000000005', 'COVID-19 (Pfizer)', 1, 'PF2025-D1', 'Pfizer-BioNTech', 'Left deltoid', '2025-06-15', '2025-06-15', '2025-07-06', 'completed', 'No adverse reactions.', NOW() - INTERVAL '265 days'),
  ('ce000000-0000-0000-0000-000000000017', 'e0000000-0000-0000-0000-000000000005', 'COVID-19 (Pfizer)', 2, 'PF2025-D2', 'Pfizer-BioNTech', 'Left deltoid', '2025-07-06', '2025-07-06', NULL, 'completed', 'Mild arm soreness for 24 hours.', NOW() - INTERVAL '245 days'),

  -- Arjuna Ranatunga
  ('ce000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000001', 'Influenza (Seasonal)', 1, 'FLU2026-12', 'Seqirus', 'Right deltoid', '2026-02-01', '2026-02-01', NULL, 'completed', 'Annual flu shot. Cardiac patient — high priority.', NOW() - INTERVAL '38 days'),
  ('ce000000-0000-0000-0000-000000000019', NULL, 'Pneumococcal (PCV20)', 1, NULL, 'Pfizer', NULL, '2026-04-15', NULL, NULL, 'scheduled', 'Recommended for diabetic patient over 55.', NOW() - INTERVAL '3 days'),

  -- Nethmi Samarakoon
  ('ce000000-0000-0000-0000-000000000018', 'e0000000-0000-0000-0000-000000000006', 'HPV (Gardasil 9)', 1, 'HPV2025-N1', 'Merck', 'Left deltoid', '2025-11-15', '2025-11-15', '2026-01-15', 'completed', 'First dose of 3-dose series.', NOW() - INTERVAL '115 days'),
  ('ce000000-0000-0000-0000-000000000018', 'e0000000-0000-0000-0000-000000000006', 'HPV (Gardasil 9)', 2, 'HPV2025-N2', 'Merck', 'Left deltoid', '2026-01-15', '2026-01-15', '2026-05-15', 'completed', 'Second dose. Mild fatigue.', NOW() - INTERVAL '55 days'),
  ('ce000000-0000-0000-0000-000000000018', NULL, 'HPV (Gardasil 9)', 3, NULL, 'Merck', NULL, '2026-05-15', NULL, NULL, 'scheduled', 'Third dose scheduled.', NOW() - INTERVAL '2 days'),

  -- Sewwandi Liyanage
  ('ce000000-0000-0000-0000-000000000020', 'e0000000-0000-0000-0000-000000000009', 'Influenza (Seasonal)', 1, 'FLU2026-15', 'Seqirus', 'Right deltoid', '2026-01-28', '2026-01-28', NULL, 'completed', 'Annual flu vaccination. Asthma patient.', NOW() - INTERVAL '42 days');

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
  ('ce000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'Exercise-Induced Asthma', 'mild', '2024-01-15', NULL, 'Pre-exercise inhaler use', 'Salbutamol 100mcg inhaler (2 puffs before exercise)', 'managed', 'Well controlled. No limitations on sports activities with pre-treatment.', NOW() - INTERVAL '120 days'),

  -- Amaya Perera
  ('ce000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005', 'Atopic Dermatitis (Eczema)', 'moderate', '2019-06-15', NULL, 'Topical corticosteroids, emollients, trigger avoidance', 'Hydrocortisone 1% cream BD, Cetirizine 10mg OD', 'active', 'Recurrent flares, mainly antecubital fossae. Triggers: dust mites, stress, dry weather.', NOW() - INTERVAL '90 days'),

  -- Janaka Herath
  ('ce000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000011', 'COPD', 'moderate', '2023-05-10', NULL, 'Tiotropium inhaler, smoking cessation, pulmonary rehab', 'Tiotropium 18mcg OD, Salbutamol PRN', 'active', 'GOLD Stage II. 30 pack-year smoking history. Quit smoking 2024. FEV1 58% predicted.', NOW() - INTERVAL '80 days'),
  ('ce000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000009', 'Chronic Rhinosinusitis', 'moderate', '2022-08-20', NULL, 'Nasal corticosteroid, saline irrigation', 'Fluticasone nasal spray BD', 'active', 'Bilateral nasal polyps grade II. Failed medical therapy — ENT surgery under consideration.', NOW() - INTERVAL '60 days'),

  -- Sandamali Peris
  ('ce000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000012', 'Subclinical Hypothyroidism', 'mild', '2025-12-01', NULL, 'Monitoring, iodine-rich diet', 'None currently — observe and repeat TSH in 3 months', 'monitoring', 'TSH 6.8, positive anti-TPO. Asymptomatic. Will treat if TSH >10 or symptoms develop.', NOW() - INTERVAL '50 days'),

  -- Arjuna Ranatunga
  ('ce000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000001', 'Coronary Artery Disease', 'severe', '2024-03-15', NULL, 'Dual antiplatelet, statin, GTN PRN, cardiac rehab', 'Aspirin 75mg OD, Clopidogrel 75mg OD, Atorvastatin 40mg nocte', 'active', 'Prior PCI with stent to LAD (2024). EF 50%. Stable on current therapy. Annual stress test.', NOW() - INTERVAL '300 days'),
  ('ce000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000012', 'Type 2 Diabetes Mellitus', 'severe', '2018-11-20', NULL, 'Insulin + oral hypoglycaemics, SMBG, diet control', 'Insulin Glargine 20u nocte, Metformin 1000mg BD', 'active', 'HbA1c 9.1%. On insulin since 2025. Retinopathy screening due. Annual foot exam.', NOW() - INTERVAL '250 days'),

  -- Sewwandi Liyanage
  ('ce000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000006', 'Polycystic Ovary Syndrome', 'moderate', '2022-09-10', NULL, 'Combined OCP, metformin, weight management', 'Yasmin OD, Metformin 500mg BD', 'active', 'Irregular cycles, mild hirsutism, BMI 28.6. LH:FSH ratio 3:1. Elevated androgens.', NOW() - INTERVAL '130 days'),
  ('ce000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000011', 'Mild Persistent Asthma', 'mild', '2021-04-05', NULL, 'Low-dose ICS, SABA PRN', 'Budesonide 200mcg BD, Salbutamol PRN', 'managed', 'Well controlled with current therapy. No ER visits. PEF >80% predicted.', NOW() - INTERVAL '110 days');

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
  ('dc000000-0000-0000-0000-000000000004', 5, '08:00', '17:00', false),
  -- Dr. Tharanga Wickramasinghe (Dermatology)
  ('dc000000-0000-0000-0000-000000000005', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000005', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000005', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000005', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000005', 5, '08:00', '17:00', true),
  -- Dr. Nimasha Gunaratne (Gynecology)
  ('dc000000-0000-0000-0000-000000000006', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000006', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000006', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000006', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000006', 5, '08:00', '17:00', true),
  -- Dr. Prasad Jayasinghe (General Surgery)
  ('dc000000-0000-0000-0000-000000000007', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000007', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000007', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000007', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000007', 5, '08:00', '17:00', true),
  -- Dr. Dilini Senanayake (Psychiatry)
  ('dc000000-0000-0000-0000-000000000008', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000008', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000008', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000008', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000008', 5, '08:00', '17:00', true),
  -- Dr. Rohan de Mel (ENT)
  ('dc000000-0000-0000-0000-000000000009', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000009', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000009', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000009', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000009', 5, '08:00', '17:00', true),
  -- Dr. Chamari Wijesundara (Ophthalmology)
  ('dc000000-0000-0000-0000-000000000010', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000010', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000010', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000010', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000010', 5, '08:00', '17:00', true),
  -- Dr. Asanka Pathirana (Pulmonology)
  ('dc000000-0000-0000-0000-000000000011', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000011', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000011', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000011', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000011', 5, '08:00', '17:00', true),
  -- Dr. Malsha Kulathunga (Endocrinology)
  ('dc000000-0000-0000-0000-000000000012', 1, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000012', 2, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000012', 3, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000012', 4, '08:00', '17:00', true),
  ('dc000000-0000-0000-0000-000000000012', 5, '08:00', '17:00', true);

-- ============================================
-- PRESCRIPTION TEMPLATES (doctor-specific reusable templates)
-- ============================================

INSERT INTO prescription_templates (id, doctor_id, name, description) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'dc000000-0000-0000-0000-000000000001', 'Hypertension Standard', 'Standard first-line treatment for essential hypertension'),
  ('f1000000-0000-0000-0000-000000000002', 'dc000000-0000-0000-0000-000000000001', 'Cardiac Post-MI', 'Post-myocardial infarction maintenance therapy'),
  ('f1000000-0000-0000-0000-000000000003', 'dc000000-0000-0000-0000-000000000002', 'Migraine Prophylaxis', 'Prophylactic treatment for chronic migraine'),
  ('f1000000-0000-0000-0000-000000000004', 'dc000000-0000-0000-0000-000000000003', 'Musculoskeletal Pain', 'Standard pain management for MSK injuries'),
  ('f1000000-0000-0000-0000-000000000005', 'dc000000-0000-0000-0000-000000000004', 'Iron Deficiency Anemia', 'Standard iron supplementation protocol'),
  ('f1000000-0000-0000-0000-000000000006', 'dc000000-0000-0000-0000-000000000005', 'Eczema Management', 'Standard eczema flare-up management'),
  ('f1000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000009', 'Sinusitis Treatment', 'Chronic sinusitis with nasal polyps management'),
  ('f1000000-0000-0000-0000-000000000008', 'dc000000-0000-0000-0000-000000000011', 'COPD Maintenance', 'COPD maintenance therapy protocol'),
  ('f1000000-0000-0000-0000-000000000009', 'dc000000-0000-0000-0000-000000000012', 'Diabetes Type 2 Insulin', 'Insulin initiation for uncontrolled T2DM');

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
  ('f1000000-0000-0000-0000-000000000005', 'Vitamin C', '500mg', 'Once daily', '3 months', 'Enhances iron absorption', 2),

  -- Eczema Management
  ('f1000000-0000-0000-0000-000000000006', 'Hydrocortisone Cream', '1%', 'Twice daily', '2 weeks', 'Apply to affected areas only. Not for face.', 0),
  ('f1000000-0000-0000-0000-000000000006', 'Cetirizine', '10mg', 'Once daily', '1 month', 'For itch relief', 1),
  ('f1000000-0000-0000-0000-000000000006', 'Emollient Cream', 'Apply liberally', 'Three times daily', 'Ongoing', 'Use as soap substitute and moisturizer', 2),

  -- Sinusitis Treatment
  ('f1000000-0000-0000-0000-000000000007', 'Fluticasone Nasal Spray', '50mcg', 'Two sprays each nostril daily', '3 months', 'Shake well before use', 0),
  ('f1000000-0000-0000-0000-000000000007', 'Amoxicillin/Clavulanate', '625mg', 'Three times daily', '14 days', 'For acute exacerbation only', 1),
  ('f1000000-0000-0000-0000-000000000007', 'Saline Nasal Rinse', 'As directed', 'Twice daily', 'Ongoing', 'Use neti pot or squeeze bottle', 2),

  -- COPD Maintenance
  ('f1000000-0000-0000-0000-000000000008', 'Tiotropium', '18mcg', 'Once daily', 'Ongoing', 'HandiHaler device. Rinse mouth after use.', 0),
  ('f1000000-0000-0000-0000-000000000008', 'Salbutamol Inhaler', '100mcg', '2 puffs PRN', 'Ongoing', 'Rescue inhaler for acute symptoms', 1),
  ('f1000000-0000-0000-0000-000000000008', 'Prednisolone', '40mg', 'Once daily', '5 days', 'For acute exacerbation only', 2),

  -- Diabetes Insulin
  ('f1000000-0000-0000-0000-000000000009', 'Insulin Glargine', '10-20 units', 'Once daily (bedtime)', 'Ongoing', 'Titrate by 2 units every 3 days. Target FBG <130', 0),
  ('f1000000-0000-0000-0000-000000000009', 'Metformin', '1000mg', 'Twice daily', 'Ongoing', 'Continue alongside insulin. Take with meals.', 1),
  ('f1000000-0000-0000-0000-000000000009', 'Glucose Test Strips', 'As needed', 'Test 4x daily initially', '3 months', 'FBG, pre-lunch, pre-dinner, bedtime', 2);

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

-- Amaya Perera rated Dr. Tharanga Wickramasinghe (Dermatology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000007', 'dc000000-0000-0000-0000-000000000005', a.id,
       5, 5, 4, 5, 'Dr. Wickramasinghe was very thorough with my eczema treatment. Skin is improving significantly.', false, NOW() - INTERVAL '17 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000007' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000005' AND a.status = 'completed' LIMIT 1;

-- Sachini Karunaratne rated Dr. Nimasha Gunaratne (Gynecology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000008', 'dc000000-0000-0000-0000-000000000006', a.id,
       4, 5, 3, 4, 'Very professional and caring. Slight wait but the consultation was thorough.', false, NOW() - INTERVAL '13 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000008' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000006' AND a.status = 'completed' LIMIT 1;

-- Ravindu Jayawardena rated Dr. Prasad Jayasinghe (General Surgery)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000009', 'dc000000-0000-0000-0000-000000000007', a.id,
       5, 5, 5, 5, 'Excellent surgeon. Explained the entire procedure clearly and the recovery has been smooth.', false, NOW() - INTERVAL '11 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000009' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000007' AND a.status = 'completed' LIMIT 1;

-- Thilini Wickramasinghe rated Dr. Dilini Senanayake (Psychiatry)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000010', 'dc000000-0000-0000-0000-000000000008', a.id,
       5, 5, 5, 5, 'Dr. Senanayake made me feel very comfortable. Great listener and the therapy sessions are helping a lot.', true, NOW() - INTERVAL '9 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000010' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000008' AND a.status = 'completed' LIMIT 1;

-- Chaminda Bandara rated Dr. Kamal Perera (Cardiology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000011', 'dc000000-0000-0000-0000-000000000001', a.id,
       4, 4, 3, 5, 'Very knowledgeable cardiologist. Had to wait a bit but the care was excellent.', false, NOW() - INTERVAL '7 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000011' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000001' AND a.status = 'completed' LIMIT 1;

-- Nadeesha Silva rated Dr. Tharanga Wickramasinghe (Dermatology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000012', 'dc000000-0000-0000-0000-000000000005', a.id,
       4, 4, 4, 4, 'Good treatment plan for my psoriasis. Looking forward to seeing improvement.', false, NOW() - INTERVAL '5 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000012' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000005' AND a.status = 'completed' LIMIT 1;

-- Isuru Abeysekara rated Dr. Sithara Silva (Neurology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000013', 'dc000000-0000-0000-0000-000000000002', a.id,
       4, 5, 3, 4, 'Dr. Silva was very attentive to my migraine issues. The new medication is helping.', false, NOW() - INTERVAL '3 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000013' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000002' AND a.status = 'completed' LIMIT 1;

-- Dilhani Mendis rated Dr. Nimasha Gunaratne (Gynecology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000014', 'dc000000-0000-0000-0000-000000000006', a.id,
       5, 5, 4, 5, 'Wonderful prenatal care. Dr. Gunaratne is very reassuring and thorough.', false, NOW() - INTERVAL '2 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000014' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000006' AND a.status = 'completed' LIMIT 1;

-- Janaka Herath rated Dr. Rohan de Mel (ENT)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000009', a.id,
       4, 4, 3, 5, 'Dr. de Mel is very experienced. Had to wait but the sinus treatment is working.', false, NOW() - INTERVAL '21 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000015' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000009' AND a.status = 'completed' LIMIT 1;

-- Janaka Herath rated Dr. Asanka Pathirana (Pulmonology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011', a.id,
       5, 5, 4, 5, 'Very thorough lung assessment. Breathing has improved significantly since starting treatment.', false, NOW() - INTERVAL '15 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000015' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000011' AND a.status = 'completed' LIMIT 1;

-- Sandamali Peris rated Dr. Chamari Wijesundara (Ophthalmology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000010', a.id,
       5, 5, 5, 5, 'Dr. Wijesundara did a thorough eye exam. Very happy with my new prescription.', false, NOW() - INTERVAL '19 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000016' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000010' AND a.status = 'completed' LIMIT 1;

-- Sandamali Peris rated Dr. Malsha Kulathunga (Endocrinology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000012', a.id,
       4, 5, 3, 4, 'Knowledgeable endocrinologist. Explained my thyroid condition well.', false, NOW() - INTERVAL '10 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000016' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000012' AND a.status = 'completed' LIMIT 1;

-- Tharindu Wijesinghe rated Dr. Kamal Perera (Cardiology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000017', 'dc000000-0000-0000-0000-000000000001', a.id,
       5, 5, 4, 5, 'Thorough cardiac screening. Reassuring and professional.', false, NOW() - INTERVAL '6 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000017' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000001' AND a.status = 'completed' LIMIT 1;

-- Nethmi Samarakoon rated Dr. Dilini Senanayake (Psychiatry) — anonymous
INSERT INTO patient_feedback (patient_id, doctor_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
VALUES ('ce000000-0000-0000-0000-000000000018', 'dc000000-0000-0000-0000-000000000008',
        5, 5, 5, 5, 'Very supportive and non-judgmental. The therapy sessions are genuinely helping.', true, NOW() - INTERVAL '4 days');

-- Arjuna Ranatunga rated Dr. Malsha Kulathunga (Endocrinology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000012', a.id,
       3, 4, 2, 3, 'Competent doctor but the wait was very long and I feel my diabetes needs more attention.', false, NOW() - INTERVAL '8 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000019' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000012' AND a.status = 'completed' LIMIT 1;

-- Arjuna Ranatunga rated Dr. Kamal Perera (Cardiology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000001', a.id,
       4, 5, 3, 4, 'Dr. Perera manages my cardiac condition well. Always explains the test results clearly.', false, NOW() - INTERVAL '18 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000019' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000001' AND a.status = 'completed' LIMIT 1;

-- Sewwandi Liyanage rated Dr. Asanka Pathirana (Pulmonology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000011', a.id,
       4, 4, 4, 5, 'Good asthma management. The new inhaler is working much better.', false, NOW() - INTERVAL '5 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000020' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000011' AND a.status = 'completed' LIMIT 1;

-- Sewwandi Liyanage rated Dr. Nimasha Gunaratne (Gynecology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006', a.id,
       5, 5, 4, 5, 'Dr. Gunaratne explained my PCOS condition and treatment options very clearly. Highly recommend.', false, NOW() - INTERVAL '12 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000020' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000006' AND a.status = 'completed' LIMIT 1;

-- Malith de Silva rated Dr. Prasad Jayasinghe (General Surgery)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000021', 'dc000000-0000-0000-0000-000000000007', a.id,
       4, 5, 3, 4, 'Dr. Jayasinghe explained the endoscopy procedure very well. Treatment is working.', false, NOW() - INTERVAL '16 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000021' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000007' AND a.status = 'completed' LIMIT 1;

-- Hiruni Rathnayake rated Dr. Chamari Wijesundara (Ophthalmology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000022', 'dc000000-0000-0000-0000-000000000010', a.id,
       5, 5, 4, 5, 'Very thorough eye examination. Dr. Wijesundara took time to explain the diabetic retinopathy findings.', false, NOW() - INTERVAL '13 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000022' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000010' AND a.status = 'completed' LIMIT 1;

-- Buddhika Senanayake rated Dr. Kamal Perera (Cardiology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000023', 'dc000000-0000-0000-0000-000000000001', a.id,
       5, 5, 4, 5, 'BP is well controlled thanks to Dr. Perera. Consistent and reliable care.', false, NOW() - INTERVAL '19 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000023' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000001' AND a.status = 'completed' LIMIT 1;

-- Shanika de Soysa rated Dr. Nimasha Gunaratne (Gynecology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000024', 'dc000000-0000-0000-0000-000000000006', a.id,
       4, 5, 3, 4, 'Very understanding and professional. Explained all the tests that were needed.', false, NOW() - INTERVAL '12 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000024' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000006' AND a.status = 'completed' LIMIT 1;

-- Roshan Gunawardena rated Dr. Rohan de Mel (ENT)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000025', 'dc000000-0000-0000-0000-000000000009', a.id,
       3, 4, 2, 3, 'Good doctor but the wait was over an hour. Hearing aid advice was helpful though.', false, NOW() - INTERVAL '6 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000025' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000009' AND a.status = 'completed' LIMIT 1;

-- Imalka Jayathilaka rated Dr. Dilini Senanayake (Psychiatry) — anonymous
INSERT INTO patient_feedback (patient_id, doctor_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
VALUES ('ce000000-0000-0000-0000-000000000026', 'dc000000-0000-0000-0000-000000000008',
        5, 5, 5, 4, 'Dr. Senanayake created a very safe and comfortable environment. I feel understood.', true, NOW() - INTERVAL '14 days');

-- Dilan Wijetunga rated Dr. Ruwan Fernando (Orthopedics)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000027', 'dc000000-0000-0000-0000-000000000003', a.id,
       4, 4, 4, 4, 'Good spine specialist. The physiotherapy plan is helping with my back pain.', false, NOW() - INTERVAL '11 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000027' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000003' AND a.status = 'completed' LIMIT 1;

-- Nishadi Kumarasinghe rated Dr. Anjali Dissanayake (Pediatrics)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000028', 'dc000000-0000-0000-0000-000000000004', a.id,
       5, 5, 5, 5, 'Dr. Dissanayake has been managing my asthma since childhood. Truly wonderful doctor.', false, NOW() - INTERVAL '9 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000028' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000004' AND a.status = 'completed' LIMIT 1;

-- Chamika Pathirana rated Dr. Asanka Pathirana (Pulmonology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000029', 'dc000000-0000-0000-0000-000000000011', a.id,
       4, 4, 3, 5, 'CPAP is making a huge difference. Dr. Pathirana explained sleep apnoea very well.', false, NOW() - INTERVAL '15 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000029' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000011' AND a.status = 'completed' LIMIT 1;

-- Thisari Weerasekara rated Dr. Sithara Silva (Neurology)
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous, created_at)
SELECT 'ce000000-0000-0000-0000-000000000030', 'dc000000-0000-0000-0000-000000000002', a.id,
       5, 5, 4, 5, 'Been seizure-free for over a year thanks to Dr. Silva. Excellent epilepsy management.', false, NOW() - INTERVAL '8 days'
FROM appointments a WHERE a.patient_id = 'ce000000-0000-0000-0000-000000000030' AND a.doctor_id = 'dc000000-0000-0000-0000-000000000002' AND a.status = 'completed' LIMIT 1;

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

-- Dr. Asanka Pathirana requests spirometry follow-up for Janaka Herath (pending)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, created_at)
VALUES ('ce000000-0000-0000-0000-000000000015', 'dc000000-0000-0000-0000-000000000011',
        'Spirometry (Follow-up)', 'normal', 'COPD monitoring. Compare with baseline FEV1 58%. On tiotropium for 3 months.',
        'pending', NOW() - INTERVAL '2 hours');

-- Dr. Malsha Kulathunga requests thyroid panel for Sandamali Peris (pending)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, created_at)
VALUES ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000012',
        'Thyroid Function Tests (Repeat)', 'normal', 'Repeat TSH and Free T4 at 3 months. Previous TSH 6.8. Assess if treatment needed.',
        'pending', NOW() - INTERVAL '1 hour');

-- Dr. Malsha Kulathunga requests HbA1c for Arjuna Ranatunga (urgent)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, assigned_to, created_at, updated_at)
VALUES ('ce000000-0000-0000-0000-000000000019', 'dc000000-0000-0000-0000-000000000012',
        'HbA1c + Fasting Glucose', 'urgent', 'Urgent — last HbA1c 9.1%. Started insulin 2 weeks ago. Assess early response.',
        'in_progress', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours');

-- Dr. Nimasha Gunaratne requests hormone panel for Sewwandi Liyanage (completed)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, assigned_to, created_at, updated_at)
VALUES ('ce000000-0000-0000-0000-000000000020', 'dc000000-0000-0000-0000-000000000006',
        'Hormone Panel (Testosterone, DHEA-S, LH, FSH)', 'normal', 'PCOS monitoring. Assess androgen levels on treatment.',
        'completed', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days');

-- Dr. Chamari Wijesundara requests visual field test for Sandamali Peris (pending)
INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes, status, created_at)
VALUES ('ce000000-0000-0000-0000-000000000016', 'dc000000-0000-0000-0000-000000000010',
        'Visual Field Test (Humphrey)', 'normal', 'Baseline visual field assessment. Myopia with mild disc cupping — rule out early glaucoma.',
        'pending', NOW() - INTERVAL '30 minutes');

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
  ('d0000000-0000-0000-0000-000000000003', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '4 days'),
  -- New doctor feedback notifications
  ('d0000000-0000-0000-0000-000000000005', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '17 days'),
  ('d0000000-0000-0000-0000-000000000005', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '5 days'),
  ('d0000000-0000-0000-0000-000000000006', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '13 days'),
  ('d0000000-0000-0000-0000-000000000006', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '2 days'),
  ('d0000000-0000-0000-0000-000000000006', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '12 days'),
  ('d0000000-0000-0000-0000-000000000007', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '11 days'),
  ('d0000000-0000-0000-0000-000000000008', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from an anonymous patient.', false, 'feedback', NOW() - INTERVAL '9 days'),
  ('d0000000-0000-0000-0000-000000000008', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from an anonymous patient.', false, 'feedback', NOW() - INTERVAL '4 days'),
  ('d0000000-0000-0000-0000-000000000009', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '21 days'),
  ('d0000000-0000-0000-0000-000000000010', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '19 days'),
  ('d0000000-0000-0000-0000-000000000011', 'feedback_received', 'New Patient Feedback', 'You received a 5-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '15 days'),
  ('d0000000-0000-0000-0000-000000000011', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '5 days'),
  ('d0000000-0000-0000-0000-000000000012', 'feedback_received', 'New Patient Feedback', 'You received a 4-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '10 days'),
  ('d0000000-0000-0000-0000-000000000012', 'feedback_received', 'New Patient Feedback', 'You received a 3-star rating from a patient.', false, 'feedback', NOW() - INTERVAL '8 days'),
  -- New lab test request notifications
  ('c0000000-0000-0000-0000-000000000015', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Asanka Pathirana has ordered a Spirometry (Follow-up) test for you.', false, 'lab_test_request', NOW() - INTERVAL '2 hours'),
  ('c0000000-0000-0000-0000-000000000016', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Malsha Kulathunga has ordered Thyroid Function Tests for you.', false, 'lab_test_request', NOW() - INTERVAL '1 hour'),
  ('c0000000-0000-0000-0000-000000000019', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Malsha Kulathunga has ordered an urgent HbA1c + Fasting Glucose test.', false, 'lab_test_request', NOW() - INTERVAL '1 day'),
  ('c0000000-0000-0000-0000-000000000016', 'lab_test_requested', 'Lab Test Ordered', 'Dr. Chamari Wijesundara has ordered a Visual Field Test for you.', false, 'lab_test_request', NOW() - INTERVAL '30 minutes'),
  -- Appointment notifications for new patients
  ('c0000000-0000-0000-0000-000000000015', 'appointment_scheduled', 'Appointment Scheduled', 'Your follow-up with Dr. Asanka Pathirana has been scheduled.', false, 'appointment', NOW() - INTERVAL '1 day'),
  ('c0000000-0000-0000-0000-000000000018', 'appointment_scheduled', 'Appointment Scheduled', 'Your counseling session with Dr. Dilini Senanayake has been scheduled.', false, 'appointment', NOW() - INTERVAL '1 day'),
  ('c0000000-0000-0000-0000-000000000019', 'medical_record_created', 'New Medical Record', 'Dr. Malsha Kulathunga added a new record: Type 2 Diabetes Mellitus (poorly controlled).', false, 'medical_record', NOW() - INTERVAL '8 days'),
  ('c0000000-0000-0000-0000-000000000020', 'prescription_created', 'New Prescription', 'Dr. Nimasha Gunaratne prescribed Combined OCP (Yasmin).', false, 'prescription', NOW() - INTERVAL '12 days');

COMMIT;
