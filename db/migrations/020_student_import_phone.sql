-- migrate:up

ALTER TABLE students
ADD COLUMN phone TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_students_phone
ON students(phone);


-- migrate:down

DROP INDEX IF EXISTS idx_students_phone;

PRAGMA foreign_keys = OFF;

CREATE TABLE students_import_phone_rollback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  second_last_name TEXT,
  email TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students_import_phone_rollback (
  id,
  control_number,
  first_name,
  last_name,
  second_last_name,
  email,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  control_number,
  first_name,
  last_name,
  second_last_name,
  email,
  is_active,
  created_at,
  updated_at
FROM students;

DROP TABLE students;

ALTER TABLE students_import_phone_rollback RENAME TO students;

PRAGMA foreign_keys = ON;