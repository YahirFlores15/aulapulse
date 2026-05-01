-- migrate:up

ALTER TABLE users
ADD COLUMN last_active_role TEXT NULL
CHECK (
  last_active_role IS NULL OR
  last_active_role IN ('SUPERUSER', 'DIRECTOR', 'TEACHER', 'TUTOR', 'SUPPORT')
);

CREATE INDEX IF NOT EXISTS idx_users_last_active_role
  ON users(last_active_role);

-- migrate:down

DROP INDEX IF EXISTS idx_users_last_active_role;

PRAGMA foreign_keys = OFF;

CREATE TABLE users__down_011 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_version INTEGER NOT NULL DEFAULT 1
);

INSERT INTO users__down_011 (
  id,
  first_name,
  last_name,
  email,
  password_hash,
  is_active,
  must_change_password,
  created_at,
  updated_at,
  session_version
)
SELECT
  id,
  first_name,
  last_name,
  email,
  password_hash,
  is_active,
  must_change_password,
  created_at,
  updated_at,
  session_version
FROM users;

DROP TABLE users;

ALTER TABLE users__down_011 RENAME TO users;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_session_version ON users(session_version);

PRAGMA foreign_keys = ON;