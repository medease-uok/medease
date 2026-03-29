-- Migration: Appointment Waitlist
-- Allows patients to join a waitlist when all slots for a doctor/date are booked.
-- When an appointment is cancelled, the first pending waitlist entry for that slot is notified.

-- Add new notification type
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'waitlist_slot_available';

-- Waitlist entry status
CREATE TYPE waitlist_status AS ENUM ('pending', 'notified', 'booked', 'cancelled', 'expired');

-- Waitlist table
CREATE TABLE appointment_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  notes TEXT,
  status waitlist_status DEFAULT 'pending',
  notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- One pending/notified entry per patient per doctor per date
  UNIQUE (patient_id, doctor_id, preferred_date)
);

-- Fast lookups when a slot opens up (cancel → notify waitlist)
CREATE INDEX idx_waitlist_doctor_date_status
  ON appointment_waitlist (doctor_id, preferred_date, status)
  WHERE status IN ('pending', 'notified');

-- Patient's own waitlist entries
CREATE INDEX idx_waitlist_patient_id ON appointment_waitlist (patient_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_waitlist_updated_at
  BEFORE UPDATE ON appointment_waitlist
  FOR EACH ROW EXECUTE FUNCTION set_waitlist_updated_at();

