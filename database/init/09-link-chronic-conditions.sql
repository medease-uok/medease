-- Link prescriptions and medical records to chronic conditions
-- This enables tracking which medications and diagnoses relate to ongoing conditions.

ALTER TABLE prescriptions
  ADD COLUMN chronic_condition_id UUID REFERENCES chronic_conditions(id) ON DELETE SET NULL;

ALTER TABLE medical_records
  ADD COLUMN chronic_condition_id UUID REFERENCES chronic_conditions(id) ON DELETE SET NULL;

CREATE INDEX idx_prescriptions_chronic_condition ON prescriptions(chronic_condition_id);
CREATE INDEX idx_medical_records_chronic_condition ON medical_records(chronic_condition_id);
