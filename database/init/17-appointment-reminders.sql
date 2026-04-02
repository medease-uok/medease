-- Appointment reminders: track which reminders have been sent to avoid duplicates
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'appointment_reminder';

CREATE TABLE appointment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'notification')),
  hours_before INT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id, reminder_type, hours_before)
);

CREATE INDEX idx_appointment_reminders_appt ON appointment_reminders(appointment_id);

GRANT ALL ON appointment_reminders TO medease_app;
