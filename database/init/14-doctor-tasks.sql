-- Doctor personal task / todo list
CREATE TABLE IF NOT EXISTS doctor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority SMALLINT NOT NULL DEFAULT 0, -- for ordering
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_tasks_doctor ON doctor_tasks(doctor_id);
CREATE INDEX idx_doctor_tasks_completed ON doctor_tasks(doctor_id, is_completed);
