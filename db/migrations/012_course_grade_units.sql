-- migrate:up

CREATE TABLE course_grade_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  weight_percentage REAL NOT NULL CHECK (weight_percentage > 0 AND weight_percentage <= 100),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_course_grade_units_unique_course_sort_order
  ON course_grade_units (course_id, sort_order);

CREATE INDEX idx_course_grade_units_course_id
  ON course_grade_units (course_id);


CREATE TABLE course_grade_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  grade_unit_id INTEGER NOT NULL,
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_unit_id) REFERENCES course_grade_units(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_course_grade_entries_unique_unit_student
  ON course_grade_entries (grade_unit_id, student_id);

CREATE INDEX idx_course_grade_entries_course_id
  ON course_grade_entries (course_id);

CREATE INDEX idx_course_grade_entries_student_id
  ON course_grade_entries (student_id);

CREATE INDEX idx_course_grade_entries_grade_unit_id
  ON course_grade_entries (grade_unit_id);

-- migrate:down

DROP INDEX IF EXISTS idx_course_grade_entries_grade_unit_id;
DROP INDEX IF EXISTS idx_course_grade_entries_student_id;
DROP INDEX IF EXISTS idx_course_grade_entries_course_id;
DROP INDEX IF EXISTS idx_course_grade_entries_unique_unit_student;
DROP TABLE IF EXISTS course_grade_entries;

DROP INDEX IF EXISTS idx_course_grade_units_course_id;
DROP INDEX IF EXISTS idx_course_grade_units_unique_course_sort_order;
DROP TABLE IF EXISTS course_grade_units;