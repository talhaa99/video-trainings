ALTER TABLE training_assignments
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS quiz_submitted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS quiz_score INT NULL,
  ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN NULL;

CREATE TABLE IF NOT EXISTS assignment_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_activity_logs_assignment_id
  ON assignment_activity_logs (assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_activity_logs_created_at
  ON assignment_activity_logs (created_at DESC);
