-- Migration: Add unique constraint to prevent concurrent appointment slot conflicts
-- Prevents race condition where two reschedules to the same slot can both pass the
-- conflict check before either commits. The unique partial index ensures only one
-- active appointment can occupy a (doctor_id, scheduled_at) slot at any time.

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_slot_active
  ON appointments (doctor_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'no_show');
