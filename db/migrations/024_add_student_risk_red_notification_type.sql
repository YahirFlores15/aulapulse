-- migrate:up

CREATE TABLE notifications_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'REFERRAL_CREATED',
      'INCIDENT_CREATED',
      'INCIDENT_CLOSED',
      'INCIDENT_REOPENED',
      'INCIDENT_NOTE_ADDED',
      'STUDENT_RISK_TURNED_RED'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NULL,
  context_type TEXT NULL,
  context_id INTEGER NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  read_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notifications_new (
  id,
  user_id,
  type,
  title,
  message,
  link,
  context_type,
  context_id,
  is_read,
  read_at,
  created_at
)
SELECT
  id,
  user_id,
  type,
  title,
  message,
  link,
  context_type,
  context_id,
  is_read,
  read_at,
  created_at
FROM notifications;

DROP TABLE notifications;

ALTER TABLE notifications_new RENAME TO notifications;

CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at);

CREATE INDEX idx_notifications_context
  ON notifications (context_type, context_id);

-- migrate:down

CREATE TABLE notifications_old (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'REFERRAL_CREATED',
      'INCIDENT_CREATED',
      'INCIDENT_CLOSED',
      'INCIDENT_REOPENED',
      'INCIDENT_NOTE_ADDED'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NULL,
  context_type TEXT NULL,
  context_id INTEGER NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  read_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notifications_old (
  id,
  user_id,
  type,
  title,
  message,
  link,
  context_type,
  context_id,
  is_read,
  read_at,
  created_at
)
SELECT
  id,
  user_id,
  type,
  title,
  message,
  link,
  context_type,
  context_id,
  is_read,
  read_at,
  created_at
FROM notifications
WHERE type <> 'STUDENT_RISK_TURNED_RED';

DROP TABLE notifications;

ALTER TABLE notifications_old RENAME TO notifications;

CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at);

CREATE INDEX idx_notifications_context
  ON notifications (context_type, context_id);
