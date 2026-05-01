-- migrate:up

CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_attendance_unique_course_student_date
  ON attendance_records (course_id, student_id, date);

CREATE INDEX idx_attendance_course_id
  ON attendance_records (course_id);

CREATE INDEX idx_attendance_student_id
  ON attendance_records (student_id);

CREATE INDEX idx_attendance_date
  ON attendance_records (date);


CREATE TABLE grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  partial_number INTEGER NOT NULL CHECK (partial_number >= 1),
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_grades_unique_course_student_partial
  ON grades (course_id, student_id, partial_number);

CREATE INDEX idx_grades_course_id
  ON grades (course_id);

CREATE INDEX idx_grades_student_id
  ON grades (student_id);

CREATE INDEX idx_grades_partial_number
  ON grades (partial_number);


CREATE TABLE incident_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  type_code TEXT NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (type_code) REFERENCES incident_types(code) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_incidents_student_id
  ON incidents (student_id);

CREATE INDEX idx_incidents_type_code
  ON incidents (type_code);

CREATE INDEX idx_incidents_created_by_user_id
  ON incidents (created_by_user_id);

CREATE INDEX idx_incidents_created_at
  ON incidents (created_at);

-- migrate:down

DROP INDEX IF EXISTS idx_incidents_created_at;
DROP INDEX IF EXISTS idx_incidents_created_by_user_id;
DROP INDEX IF EXISTS idx_incidents_type_code;
DROP INDEX IF EXISTS idx_incidents_student_id;
DROP TABLE IF EXISTS incidents;

DROP TABLE IF EXISTS incident_types;

DROP INDEX IF EXISTS idx_grades_partial_number;
DROP INDEX IF EXISTS idx_grades_student_id;
DROP INDEX IF EXISTS idx_grades_course_id;
DROP INDEX IF EXISTS idx_grades_unique_course_student_partial;
DROP TABLE IF EXISTS grades;

DROP INDEX IF EXISTS idx_attendance_date;
DROP INDEX IF EXISTS idx_attendance_student_id;
DROP INDEX IF EXISTS idx_attendance_course_id;
DROP INDEX IF EXISTS idx_attendance_unique_course_student_date;
DROP TABLE IF EXISTS attendance_records;