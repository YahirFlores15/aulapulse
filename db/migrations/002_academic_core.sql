-- migrate:up

CREATE TABLE IF NOT EXISTS cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id, code),
  FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
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

CREATE TABLE IF NOT EXISTS group_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id, student_id),
  UNIQUE (group_id, student_id),
  FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  teacher_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id, group_id, subject_id, teacher_user_id),
  FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS group_tutors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL UNIQUE,
  tutor_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (tutor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_groups_cycle_id ON groups(cycle_id);
CREATE INDEX IF NOT EXISTS idx_group_students_cycle_id ON group_students(cycle_id);
CREATE INDEX IF NOT EXISTS idx_group_students_group_id ON group_students(group_id);
CREATE INDEX IF NOT EXISTS idx_group_students_student_id ON group_students(student_id);
CREATE INDEX IF NOT EXISTS idx_courses_cycle_id ON courses(cycle_id);
CREATE INDEX IF NOT EXISTS idx_courses_group_id ON courses(group_id);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_user_id ON courses(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_group_tutors_tutor_user_id ON group_tutors(tutor_user_id);

-- migrate:down

DROP INDEX IF EXISTS idx_group_tutors_tutor_user_id;
DROP INDEX IF EXISTS idx_courses_teacher_user_id;
DROP INDEX IF EXISTS idx_courses_subject_id;
DROP INDEX IF EXISTS idx_courses_group_id;
DROP INDEX IF EXISTS idx_courses_cycle_id;
DROP INDEX IF EXISTS idx_group_students_student_id;
DROP INDEX IF EXISTS idx_group_students_group_id;
DROP INDEX IF EXISTS idx_group_students_cycle_id;
DROP INDEX IF EXISTS idx_groups_cycle_id;

DROP TABLE IF EXISTS group_tutors;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS group_students;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS cycles;