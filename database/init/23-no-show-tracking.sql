-- Add no-show tracking columns to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS no_show_flagged BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS no_show_flag_date TIMESTAMP;

-- Add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_show_count_non_negative') THEN
    ALTER TABLE patients ADD CONSTRAINT no_show_count_non_negative CHECK (no_show_count >= 0);
  END IF;
END$$;

-- Create index for flagged patients lookup
CREATE INDEX IF NOT EXISTS idx_patients_no_show_flagged ON patients(no_show_flagged) WHERE no_show_flagged = true;

-- Create index for no_show_count for analytics
CREATE INDEX IF NOT EXISTS idx_patients_no_show_count ON patients(no_show_count) WHERE no_show_count > 0;

-- Add comment for documentation
COMMENT ON COLUMN patients.no_show_count IS 'Total number of missed appointments (no-shows) for this patient';
COMMENT ON COLUMN patients.no_show_flagged IS 'Automatically set to true when no_show_count reaches 3 or more';
COMMENT ON COLUMN patients.no_show_flag_date IS 'Timestamp when patient was flagged for excessive no-shows';

-- Add new notification types for no-show tracking
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'appointment_no_show';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'patient_flagged_no_show';
