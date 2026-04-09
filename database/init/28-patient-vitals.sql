-- Table for Patient Vitals (Nurse entry)
CREATE TABLE IF NOT EXISTS patient_vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
    temperature NUMERIC(4,2), -- Celsius
    blood_pressure_sys INTEGER, -- mmHg
    blood_pressure_dia INTEGER, -- mmHg
    heart_rate INTEGER, -- bpm
    respiratory_rate INTEGER, -- breaths/min
    spo2 INTEGER, -- %
    weight NUMERIC(5,2), -- kg
    height NUMERIC(5,2), -- cm
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_at ON patient_vitals(recorded_at DESC);
