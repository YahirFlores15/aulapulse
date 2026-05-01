-- migrate:up

ALTER TABLE incidents
ADD COLUMN course_id INTEGER NULL
REFERENCES courses(id) ON DELETE SET NULL;

ALTER TABLE incidents
ADD COLUMN group_id INTEGER NULL
REFERENCES groups(id) ON DELETE SET NULL;

ALTER TABLE incidents
ADD COLUMN source_role TEXT NULL
CHECK (source_role IN ('DIRECTOR', 'TEACHER', 'TUTOR'));

ALTER TABLE incidents
ADD COLUMN last_status_changed_at TEXT NULL;

ALTER TABLE incidents
ADD COLUMN reopened_at TEXT NULL;

ALTER TABLE incidents
ADD COLUMN reopened_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT;

UPDATE incidents
SET last_status_changed_at = COALESCE(updated_at, closed_at, created_at)
WHERE last_status_changed_at IS NULL;

CREATE INDEX idx_incidents_course_id
  ON incidents (course_id);

CREATE INDEX idx_incidents_group_id
  ON incidents (group_id);

CREATE INDEX idx_incidents_source_role
  ON incidents (source_role);

CREATE INDEX idx_incidents_last_status_changed_at
  ON incidents (last_status_changed_at);

CREATE INDEX idx_incidents_reopened_by_user_id
  ON incidents (reopened_by_user_id);


CREATE TABLE incident_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  author_user_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_incident_notes_incident_id
  ON incident_notes (incident_id);

CREATE INDEX idx_incident_notes_author_user_id
  ON incident_notes (author_user_id);

CREATE INDEX idx_incident_notes_created_at
  ON incident_notes (created_at);


CREATE TABLE incident_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'INCIDENT_CREATED',
      'NOTE_ADDED',
      'INCIDENT_CLOSED',
      'INCIDENT_REOPENED'
    )
  ),
  actor_user_id INTEGER NOT NULL,
  from_value TEXT NULL,
  to_value TEXT NULL,
  note TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_incident_events_incident_id
  ON incident_events (incident_id);

CREATE INDEX idx_incident_events_actor_user_id
  ON incident_events (actor_user_id);

CREATE INDEX idx_incident_events_event_type
  ON incident_events (event_type);

CREATE INDEX idx_incident_events_created_at
  ON incident_events (created_at);


INSERT INTO incident_events (
  incident_id,
  event_type,
  actor_user_id,
  from_value,
  to_value,
  note,
  created_at
)
SELECT
  i.id,
  'INCIDENT_CREATED',
  i.created_by_user_id,
  NULL,
  i.status,
  'Evento inicial migrado desde incidencias existentes.',
  i.created_at
FROM incidents i;


CREATE TABLE notifications_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
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
  context_type TEXT NULL CHECK (
    context_type IN (
      'REFERRAL_CASE',
      'INCIDENT'
    )
  ),
  context_id INTEGER NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  read_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

CREATE INDEX idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX idx_notifications_user_id_is_read
  ON notifications(user_id, is_read);

CREATE INDEX idx_notifications_created_at
  ON notifications(created_at);

CREATE INDEX idx_notifications_context
  ON notifications(context_type, context_id);


-- migrate:down

CREATE TABLE notifications_old (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REFERRAL_CREATED')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NULL,
  context_type TEXT NULL CHECK (context_type IN ('REFERRAL_CASE')),
  context_id INTEGER NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  read_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
WHERE type = 'REFERRAL_CREATED'
  AND (
    context_type IS NULL
    OR context_type = 'REFERRAL_CASE'
  );

DROP TABLE notifications;

ALTER TABLE notifications_old RENAME TO notifications;

CREATE INDEX idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX idx_notifications_user_id_is_read
  ON notifications(user_id, is_read);

CREATE INDEX idx_notifications_created_at
  ON notifications(created_at);

CREATE INDEX idx_notifications_context
  ON notifications(context_type, context_id);


DROP INDEX IF EXISTS idx_incident_events_created_at;
DROP INDEX IF EXISTS idx_incident_events_event_type;
DROP INDEX IF EXISTS idx_incident_events_actor_user_id;
DROP INDEX IF EXISTS idx_incident_events_incident_id;

DROP TABLE IF EXISTS incident_events;

DROP INDEX IF EXISTS idx_incident_notes_created_at;
DROP INDEX IF EXISTS idx_incident_notes_author_user_id;
DROP INDEX IF EXISTS idx_incident_notes_incident_id;

DROP TABLE IF EXISTS incident_notes;

DROP INDEX IF EXISTS idx_incidents_reopened_by_user_id;
DROP INDEX IF EXISTS idx_incidents_last_status_changed_at;
DROP INDEX IF EXISTS idx_incidents_source_role;
DROP INDEX IF EXISTS idx_incidents_group_id;
DROP INDEX IF EXISTS idx_incidents_course_id;

ALTER TABLE incidents DROP COLUMN reopened_by_user_id;
ALTER TABLE incidents DROP COLUMN reopened_at;
ALTER TABLE incidents DROP COLUMN last_status_changed_at;
ALTER TABLE incidents DROP COLUMN source_role;
ALTER TABLE incidents DROP COLUMN group_id;
ALTER TABLE incidents DROP COLUMN course_id;