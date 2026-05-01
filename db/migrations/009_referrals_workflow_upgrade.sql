-- migrate:up

ALTER TABLE referral_cases
ADD COLUMN target_area TEXT NOT NULL DEFAULT 'PEDAGOGY'
CHECK (target_area IN ('PEDAGOGY', 'PSYCHOLOGY'));

ALTER TABLE referral_cases
ADD COLUMN closed_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE referral_cases
ADD COLUMN reopened_at TEXT NULL;

ALTER TABLE referral_cases
ADD COLUMN reopened_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE referral_cases
ADD COLUMN related_teacher_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE referral_cases
ADD COLUMN last_status_changed_at TEXT NULL;

UPDATE referral_cases
SET
  target_area = CASE
    WHEN shared_with_support = 1 THEN 'PEDAGOGY'
    ELSE 'PEDAGOGY'
  END,
  last_status_changed_at = CASE
    WHEN closed_at IS NOT NULL THEN closed_at
    ELSE opened_at
  END;

CREATE INDEX IF NOT EXISTS idx_referral_cases_target_area
ON referral_cases(target_area);

CREATE INDEX IF NOT EXISTS idx_referral_cases_closed_by_user_id
ON referral_cases(closed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_cases_reopened_by_user_id
ON referral_cases(reopened_by_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_cases_related_teacher_user_id
ON referral_cases(related_teacher_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_cases_last_status_changed_at
ON referral_cases(last_status_changed_at);

CREATE TABLE referral_case_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'CASE_CREATED',
      'NOTE_ADDED',
      'CASE_CLOSED',
      'CASE_REOPENED',
      'TARGET_CHANGED'
    )
  ),
  actor_user_id INTEGER NOT NULL,
  from_value TEXT NULL,
  to_value TEXT NULL,
  note TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES referral_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_referral_case_events_case_id
ON referral_case_events(case_id);

CREATE INDEX IF NOT EXISTS idx_referral_case_events_actor_user_id
ON referral_case_events(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_case_events_event_type
ON referral_case_events(event_type);

CREATE INDEX IF NOT EXISTS idx_referral_case_events_created_at
ON referral_case_events(created_at);

INSERT INTO referral_case_events (
  case_id,
  event_type,
  actor_user_id,
  from_value,
  to_value,
  note,
  created_at
)
SELECT
  rc.id,
  'CASE_CREATED',
  rc.created_by_user_id,
  NULL,
  rc.status,
  'Evento inicial migrado desde casos existentes.',
  rc.created_at
FROM referral_cases rc;

INSERT INTO referral_case_events (
  case_id,
  event_type,
  actor_user_id,
  from_value,
  to_value,
  note,
  created_at
)
SELECT
  rc.id,
  'CASE_CLOSED',
  COALESCE(rc.closed_by_user_id, rc.created_by_user_id),
  'OPEN',
  'CLOSED',
  'Cierre migrado desde casos existentes.',
  rc.closed_at
FROM referral_cases rc
WHERE rc.closed_at IS NOT NULL
  AND rc.status = 'CLOSED';

-- migrate:down

DROP INDEX IF EXISTS idx_referral_case_events_created_at;
DROP INDEX IF EXISTS idx_referral_case_events_event_type;
DROP INDEX IF EXISTS idx_referral_case_events_actor_user_id;
DROP INDEX IF EXISTS idx_referral_case_events_case_id;

DROP TABLE IF EXISTS referral_case_events;

DROP INDEX IF EXISTS idx_referral_cases_last_status_changed_at;
DROP INDEX IF EXISTS idx_referral_cases_related_teacher_user_id;
DROP INDEX IF EXISTS idx_referral_cases_reopened_by_user_id;
DROP INDEX IF EXISTS idx_referral_cases_closed_by_user_id;
DROP INDEX IF EXISTS idx_referral_cases_target_area;

ALTER TABLE referral_cases DROP COLUMN last_status_changed_at;
ALTER TABLE referral_cases DROP COLUMN related_teacher_user_id;
ALTER TABLE referral_cases DROP COLUMN reopened_by_user_id;
ALTER TABLE referral_cases DROP COLUMN reopened_at;
ALTER TABLE referral_cases DROP COLUMN closed_by_user_id;
ALTER TABLE referral_cases DROP COLUMN target_area;