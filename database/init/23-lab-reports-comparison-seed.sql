-- Seed data for lab report comparison feature
-- Add multiple test results over time for the same patient to enable trending

-- Get Sarah Fernando's patient ID (ce000000-0000-0000-0000-000000000001)
-- Add historical CBC tests showing improvement over time
INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Complete Blood Count (CBC)',
    'WBC: 5.2 x10^9/L, RBC: 4.1 x10^12/L, Hemoglobin: 11.8 g/dL, Platelets: 180 x10^9/L, Hematocrit: 35.2%',
    'Mild anemia noted. Started on iron supplementation.',
    '2026-01-15 09:00:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Complete Blood Count (CBC)',
    'WBC: 5.8 x10^9/L, RBC: 4.4 x10^12/L, Hemoglobin: 12.5 g/dL, Platelets: 210 x10^9/L, Hematocrit: 37.1%',
    'Improvement in hemoglobin levels. Continue iron supplements.',
    '2026-02-15 09:30:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Complete Blood Count (CBC)',
    'WBC: 6.3 x10^9/L, RBC: 4.7 x10^12/L, Hemoglobin: 13.2 g/dL, Platelets: 240 x10^9/L, Hematocrit: 39.5%',
    'Hemoglobin now in normal range. Continue current regimen.',
    '2026-03-15 10:00:00'
  );

-- Add HbA1c tests for diabetes monitoring (same patient)
INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'HbA1c',
    'HbA1c: 7.2%, Average Glucose: 161 mg/dL',
    'Prediabetic range. Lifestyle modifications recommended.',
    '2026-01-20 08:00:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'HbA1c',
    'HbA1c: 6.5%, Average Glucose: 140 mg/dL',
    'Improved with diet and exercise. Continue current plan.',
    '2026-02-20 08:15:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'HbA1c',
    'HbA1c: 5.9%, Average Glucose: 123 mg/dL',
    'Now in normal range. Excellent progress!',
    '2026-03-20 08:30:00'
  );

-- Add Lipid Panel tests showing cholesterol management
INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Lipid Panel',
    'Total Cholesterol: 245 mg/dL, LDL: 165 mg/dL, HDL: 42 mg/dL, Triglycerides: 190 mg/dL',
    'Elevated cholesterol. Started on statin therapy.',
    '2026-01-10 09:00:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Lipid Panel',
    'Total Cholesterol: 210 mg/dL, LDL: 135 mg/dL, HDL: 48 mg/dL, Triglycerides: 155 mg/dL',
    'Good response to medication. Continue statin.',
    '2026-02-10 09:15:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Lipid Panel',
    'Total Cholesterol: 195 mg/dL, LDL: 115 mg/dL, HDL: 52 mg/dL, Triglycerides: 140 mg/dL',
    'Excellent improvement. Target levels achieved.',
    '2026-03-10 09:30:00'
  );

-- Add Thyroid Panel (TSH) tests
INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Thyroid Panel (TSH)',
    'TSH: 8.5 mIU/L, Free T4: 0.8 ng/dL',
    'Hypothyroidism. Started levothyroxine 50mcg.',
    '2026-01-25 08:00:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Thyroid Panel (TSH)',
    'TSH: 5.2 mIU/L, Free T4: 1.1 ng/dL',
    'Improved. Increased dose to 75mcg.',
    '2026-02-25 08:15:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Thyroid Panel (TSH)',
    'TSH: 2.8 mIU/L, Free T4: 1.3 ng/dL',
    'Now in optimal range. Continue 75mcg dose.',
    '2026-03-25 08:30:00'
  );

-- Add Blood Pressure monitoring tests (for context with existing hypertension diagnosis)
INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Blood Pressure Monitoring',
    'Systolic: 148 mmHg, Diastolic: 94 mmHg, Heart Rate: 78 bpm',
    'Stage 1 Hypertension. Lifestyle modifications advised.',
    '2026-01-05 10:00:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Blood Pressure Monitoring',
    'Systolic: 138 mmHg, Diastolic: 88 mmHg, Heart Rate: 72 bpm',
    'Improvement with diet and exercise.',
    '2026-02-05 10:15:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000001',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Blood Pressure Monitoring',
    'Systolic: 128 mmHg, Diastolic: 82 mmHg, Heart Rate: 68 bpm',
    'Now in normal range. Continue current management.',
    '2026-03-05 10:30:00'
  );

-- Add some data for another patient for comparison
-- Get Dinesh Rajapaksa's patient ID (ce000000-0000-0000-0000-000000000002)
INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, report_date) VALUES
  (
    'ce000000-0000-0000-0000-000000000002',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Complete Blood Count (CBC)',
    'WBC: 7.5 x10^9/L, RBC: 5.1 x10^12/L, Hemoglobin: 14.8 g/dL, Platelets: 220 x10^9/L, Hematocrit: 44.2%',
    'All values within normal limits.',
    '2026-01-10 11:00:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000002',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Complete Blood Count (CBC)',
    'WBC: 7.2 x10^9/L, RBC: 5.0 x10^12/L, Hemoglobin: 14.5 g/dL, Platelets: 215 x10^9/L, Hematocrit: 43.8%',
    'Stable values. Continue routine monitoring.',
    '2026-02-10 11:15:00'
  ),
  (
    'ce000000-0000-0000-0000-000000000002',
    (SELECT id FROM users WHERE role = 'lab_technician' LIMIT 1),
    'Complete Blood Count (CBC)',
    'WBC: 6.9 x10^9/L, RBC: 4.9 x10^12/L, Hemoglobin: 14.2 g/dL, Platelets: 210 x10^9/L, Hematocrit: 43.1%',
    'Consistently normal values.',
    '2026-03-10 11:30:00'
  );

COMMENT ON TABLE lab_reports IS 'Lab reports table with seed data for comparison feature - tracks test results over time for trending analysis';
