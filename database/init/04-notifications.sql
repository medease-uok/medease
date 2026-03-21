-- Notifications table
CREATE TYPE notification_type AS ENUM (
  'appointment_scheduled',
  'appointment_cancelled',
  'prescription_created',
  'prescription_dispensed',
  'lab_report_ready',
  'medical_record_created',
  'refill_requested',
  'refill_approved',
  'refill_denied',
  'document_uploaded',
  'lab_test_requested',
  'feedback_received',
  'system'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  reference_id UUID,
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Grant access
GRANT ALL ON notifications TO medease_app;
