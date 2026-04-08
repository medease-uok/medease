-- Table for Nurse Care Notes
CREATE TABLE IF NOT EXISTS nurse_care_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nurse_care_notes_nurse_id ON nurse_care_notes(nurse_id);
CREATE INDEX IF NOT EXISTS idx_nurse_care_notes_patient_id ON nurse_care_notes(patient_id);
