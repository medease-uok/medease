-- Recurring appointments support
CREATE TYPE recurrence_pattern AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

-- Add recurrence columns to appointments table
ALTER TABLE appointments
  ADD COLUMN series_id UUID,
  ADD COLUMN recurrence_pattern recurrence_pattern,
  ADD COLUMN recurrence_end_date DATE;

-- Index for fetching all appointments in a series
CREATE INDEX idx_appointments_series ON appointments(series_id) WHERE series_id IS NOT NULL;

-- Grant access
GRANT ALL ON appointments TO medease_app;
