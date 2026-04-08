-- Nurse personal task / todo list
CREATE TABLE IF NOT EXISTS nurse_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority SMALLINT NOT NULL DEFAULT 0, -- for ordering
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nurse_tasks_nurse ON nurse_tasks(nurse_id);
CREATE INDEX idx_nurse_tasks_completed ON nurse_tasks(nurse_id, is_completed);
