DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'employee_id_seq') THEN
    CREATE SEQUENCE employee_id_seq START 1;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE DEFAULT ('EMP-' || LPAD(nextval('employee_id_seq')::TEXT, 6, '0')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS induction_recipients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_assignments (
  id BIGSERIAL PRIMARY KEY,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('employee', 'external')),
  employee_id BIGINT NULL REFERENCES employees(id) ON DELETE CASCADE,
  external_recipient_id BIGINT NULL REFERENCES induction_recipients(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL DEFAULT 'safety_induction',
  access_token TEXT NOT NULL UNIQUE,
  email_sent_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (recipient_type = 'employee' AND employee_id IS NOT NULL AND external_recipient_id IS NULL) OR
    (recipient_type = 'external' AND external_recipient_id IS NOT NULL AND employee_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS email_logs (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_induction_recipients_email ON induction_recipients(email);
CREATE INDEX IF NOT EXISTS idx_training_assignments_token ON training_assignments(access_token);
CREATE INDEX IF NOT EXISTS idx_training_assignments_created_at ON training_assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_assignment_id ON email_logs(assignment_id);

ALTER TABLE employees
  ALTER COLUMN employee_id SET DEFAULT ('EMP-' || LPAD(nextval('employee_id_seq')::TEXT, 6, '0'));

CREATE OR REPLACE FUNCTION update_common_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_common_updated_at();

DROP TRIGGER IF EXISTS trg_induction_recipients_updated_at ON induction_recipients;
CREATE TRIGGER trg_induction_recipients_updated_at
BEFORE UPDATE ON induction_recipients
FOR EACH ROW
EXECUTE FUNCTION update_common_updated_at();

DROP TRIGGER IF EXISTS trg_training_assignments_updated_at ON training_assignments;
CREATE TRIGGER trg_training_assignments_updated_at
BEFORE UPDATE ON training_assignments
FOR EACH ROW
EXECUTE FUNCTION update_common_updated_at();
