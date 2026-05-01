-- migrate:up

CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_user_id
ON notifications(user_id);

CREATE INDEX idx_notifications_user_id_is_read
ON notifications(user_id, is_read);

CREATE INDEX idx_notifications_created_at
ON notifications(created_at);

CREATE INDEX idx_notifications_context
ON notifications(context_type, context_id);

-- migrate:down

DROP INDEX IF EXISTS idx_notifications_context;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id_is_read;
DROP INDEX IF EXISTS idx_notifications_user_id;

DROP TABLE IF EXISTS notifications;