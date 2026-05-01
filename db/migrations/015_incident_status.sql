-- migrate:up

ALTER TABLE incidents
ADD COLUMN status TEXT NOT NULL DEFAULT 'OPEN'
CHECK (status IN ('OPEN', 'CLOSED'));

ALTER TABLE incidents
ADD COLUMN closed_at TEXT NULL;

ALTER TABLE incidents
ADD COLUMN closed_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE incidents
ADD COLUMN updated_at TEXT NULL;

UPDATE incidents
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

CREATE INDEX idx_incidents_status
  ON incidents (status);

CREATE INDEX idx_incidents_student_status
  ON incidents (student_id, status);

CREATE INDEX idx_incidents_closed_by_user_id
  ON incidents (closed_by_user_id);

-- migrate:down

DROP INDEX IF EXISTS idx_incidents_closed_by_user_id;
DROP INDEX IF EXISTS idx_incidents_student_status;
DROP INDEX IF EXISTS idx_incidents_status;

ALTER TABLE incidents DROP COLUMN updated_at;
ALTER TABLE incidents DROP COLUMN closed_by_user_id;
ALTER TABLE incidents DROP COLUMN closed_at;
ALTER TABLE incidents DROP COLUMN status;