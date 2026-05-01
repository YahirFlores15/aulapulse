-- migrate:up

INSERT OR IGNORE INTO roles (code, name) VALUES
  ('PEDAGOGIA', 'Pedagogía'),
  ('PSICOLOGIA', 'Psicología');

PRAGMA foreign_keys = OFF;

CREATE TABLE users_support_area_split_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_version INTEGER NOT NULL DEFAULT 1,
  last_active_role TEXT NULL
  CHECK (
    last_active_role IS NULL OR
    last_active_role IN (
      'SUPERUSER',
      'DIRECTOR',
      'TEACHER',
      'TUTOR',
      'SUPPORT',
      'PEDAGOGIA',
      'PSICOLOGIA'
    )
  )
);

INSERT INTO users_support_area_split_new (
  id,
  first_name,
  last_name,
  email,
  password_hash,
  is_active,
  must_change_password,
  created_at,
  updated_at,
  session_version,
  last_active_role
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
  session_version,
  last_active_role
FROM users;

DROP TABLE users;

ALTER TABLE users_support_area_split_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_is_active
ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_users_session_version
ON users(session_version);

CREATE INDEX IF NOT EXISTS idx_users_last_active_role
ON users(last_active_role);

PRAGMA foreign_keys = ON;


-- migrate:down

PRAGMA foreign_keys = OFF;

CREATE TABLE users_support_area_split_rollback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_version INTEGER NOT NULL DEFAULT 1,
  last_active_role TEXT NULL
  CHECK (
    last_active_role IS NULL OR
    last_active_role IN (
      'SUPERUSER',
      'DIRECTOR',
      'TEACHER',
      'TUTOR',
      'SUPPORT'
    )
  )
);

INSERT INTO users_support_area_split_rollback (
  id,
  first_name,
  last_name,
  email,
  password_hash,
  is_active,
  must_change_password,
  created_at,
  updated_at,
  session_version,
  last_active_role
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
  CASE
    WHEN session_version IS NULL THEN 1
    ELSE session_version + 1
  END,
  CASE
    WHEN last_active_role IN ('PEDAGOGIA', 'PSICOLOGIA') THEN NULL
    ELSE last_active_role
  END
FROM users;

DROP TABLE users;

ALTER TABLE users_support_area_split_rollback RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_is_active
ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_users_session_version
ON users(session_version);

CREATE INDEX IF NOT EXISTS idx_users_last_active_role
ON users(last_active_role);

DELETE FROM user_roles
WHERE role_id IN (
  SELECT id
  FROM roles
  WHERE code IN ('PEDAGOGIA', 'PSICOLOGIA')
);

DELETE FROM roles
WHERE code IN ('PEDAGOGIA', 'PSICOLOGIA');

PRAGMA foreign_keys = ON;