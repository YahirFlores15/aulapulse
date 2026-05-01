-- migrate:up

ALTER TABLE users
ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_users_session_version
  ON users(session_version);

-- migrate:down

DROP INDEX IF EXISTS idx_users_session_version;
DROP INDEX IF EXISTS idx_users_is_active;