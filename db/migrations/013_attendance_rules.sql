-- migrate:up

CREATE TABLE course_attendance_non_applicable_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  reason TEXT NULL,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_course_attendance_non_applicable_unique_course_date
  ON course_attendance_non_applicable_days (course_id, date);

CREATE INDEX idx_course_attendance_non_applicable_course_id
  ON course_attendance_non_applicable_days (course_id);

CREATE INDEX idx_course_attendance_non_applicable_date
  ON course_attendance_non_applicable_days (date);

CREATE INDEX idx_attendance_records_course_date
  ON attendance_records (course_id, date);

CREATE INDEX idx_attendance_records_course_student_date_status
  ON attendance_records (course_id, student_id, date, status);

-- migrate:down

DROP INDEX IF EXISTS idx_attendance_records_course_student_date_status;
DROP INDEX IF EXISTS idx_attendance_records_course_date;

DROP INDEX IF EXISTS idx_course_attendance_non_applicable_date;
DROP INDEX IF EXISTS idx_course_attendance_non_applicable_course_id;
DROP INDEX IF EXISTS idx_course_attendance_non_applicable_unique_course_date;

DROP TABLE IF EXISTS course_attendance_non_applicable_days;