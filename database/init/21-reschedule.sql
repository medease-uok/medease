-- Migration: Reschedule Appointment
-- Adds the reschedule_appointment permission and appointment_rescheduled notification type.

-- New notification type for reschedule events
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'appointment_rescheduled';

-- New permission
INSERT INTO permissions (name, description, resource)
VALUES ('reschedule_appointment', 'Reschedule an existing appointment to a new time slot', 'appointments')
ON CONFLICT (name) DO NOTHING;

-- Grant to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE p.name = 'reschedule_appointment'
  AND r.name IN ('admin', 'doctor', 'nurse', 'patient')
ON CONFLICT DO NOTHING;
