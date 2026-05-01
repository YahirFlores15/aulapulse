CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id, code),
  FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE RESTRICT
);
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  second_last_name TEXT,
  email TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, phone TEXT NULL);
CREATE TABLE group_students (
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
CREATE TABLE courses (
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
CREATE TABLE group_tutors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL UNIQUE,
  tutor_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (tutor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
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
  note TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'OPEN'
CHECK (status IN ('OPEN', 'CLOSED')), closed_at TEXT NULL, closed_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT, updated_at TEXT NULL, course_id INTEGER NULL
REFERENCES courses(id) ON DELETE SET NULL, group_id INTEGER NULL
REFERENCES groups(id) ON DELETE SET NULL, source_role TEXT NULL
CHECK (source_role IN ('DIRECTOR', 'TEACHER', 'TUTOR')), last_status_changed_at TEXT NULL, reopened_at TEXT NULL, reopened_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (type_code) REFERENCES incident_types(code) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE TABLE referral_reason_catalog (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE referral_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  reason_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  summary TEXT NOT NULL,
  shared_with_support INTEGER NOT NULL DEFAULT 0 CHECK (shared_with_support IN (0, 1)),
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, target_area TEXT NOT NULL DEFAULT 'PEDAGOGY'
CHECK (target_area IN ('PEDAGOGY', 'PSYCHOLOGY')), closed_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT, reopened_at TEXT NULL, reopened_by_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT, related_teacher_user_id INTEGER NULL
REFERENCES users(id) ON DELETE RESTRICT, last_status_changed_at TEXT NULL, incident_id INTEGER NULL
REFERENCES incidents(id) ON DELETE SET NULL, academic_context_json TEXT NULL, created_from_role TEXT NULL
CHECK (
  created_from_role IS NULL OR
  created_from_role IN ('TEACHER', 'TUTOR')
),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (reason_code) REFERENCES referral_reason_catalog(code)
);
CREATE TABLE referral_case_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  author_user_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES referral_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);
CREATE TABLE subject_risk_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    risk_status TEXT NOT NULL CHECK (risk_status IN ('GREEN', 'YELLOW', 'RED')),
    average_score REAL NULL,
    equivalent_absences_week INTEGER NOT NULL DEFAULT 0,
    attendance_risk TEXT NULL CHECK (attendance_risk IN ('GREEN', 'YELLOW', 'RED')),
    grade_risk TEXT NULL CHECK (grade_risk IN ('GREEN', 'YELLOW', 'RED')),
    calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, is_incomplete INTEGER NOT NULL DEFAULT 1 CHECK (is_incomplete IN (0, 1)),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE (course_id, student_id)
);
CREATE TABLE referral_case_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'CASE_CREATED',
      'NOTE_ADDED',
      'CASE_CLOSED',
      'CASE_REOPENED',
      'TARGET_CHANGED'
    )
  ),
  actor_user_id INTEGER NOT NULL,
  from_value TEXT NULL,
  to_value TEXT NULL,
  note TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES referral_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
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
CREATE TABLE student_traffic_light_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('GREEN', 'YELLOW', 'RED')),
  causes_json TEXT NOT NULL DEFAULT '[]',
  red_causes_count INTEGER NOT NULL DEFAULT 0 CHECK (red_causes_count >= 0),
  yellow_causes_count INTEGER NOT NULL DEFAULT 0 CHECK (yellow_causes_count >= 0),
  calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (student_id)
);
CREATE TABLE incident_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  author_user_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
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
CREATE TABLE IF NOT EXISTS "cycles" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  ordinal INTEGER NOT NULL CHECK (ordinal IN (1, 2, 3)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_date <= end_date),
  UNIQUE (year, ordinal)
);
CREATE TABLE IF NOT EXISTS "users" (
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
      'PEDAGOGIA',
      'PSICOLOGIA'
    )
  )
);
CREATE TABLE IF NOT EXISTS "notifications" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'REFERRAL_CREATED',
      'INCIDENT_CREATED',
      'INCIDENT_CLOSED',
      'INCIDENT_REOPENED',
      'INCIDENT_NOTE_ADDED',
      'STUDENT_RISK_TURNED_RED'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NULL,
  context_type TEXT NULL,
  context_id INTEGER NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  read_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_groups_cycle_id ON groups(cycle_id);
CREATE INDEX idx_group_students_cycle_id ON group_students(cycle_id);
CREATE INDEX idx_group_students_group_id ON group_students(group_id);
CREATE INDEX idx_group_students_student_id ON group_students(student_id);
CREATE INDEX idx_courses_cycle_id ON courses(cycle_id);
CREATE INDEX idx_courses_group_id ON courses(group_id);
CREATE INDEX idx_courses_subject_id ON courses(subject_id);
CREATE INDEX idx_courses_teacher_user_id ON courses(teacher_user_id);
CREATE INDEX idx_group_tutors_tutor_user_id ON group_tutors(tutor_user_id);
CREATE UNIQUE INDEX idx_attendance_unique_course_student_date
  ON attendance_records (course_id, student_id, date);
CREATE INDEX idx_attendance_course_id
  ON attendance_records (course_id);
CREATE INDEX idx_attendance_student_id
  ON attendance_records (student_id);
CREATE INDEX idx_attendance_date
  ON attendance_records (date);
CREATE UNIQUE INDEX idx_grades_unique_course_student_partial
  ON grades (course_id, student_id, partial_number);
CREATE INDEX idx_grades_course_id
  ON grades (course_id);
CREATE INDEX idx_grades_student_id
  ON grades (student_id);
CREATE INDEX idx_grades_partial_number
  ON grades (partial_number);
CREATE INDEX idx_incidents_student_id
  ON incidents (student_id);
CREATE INDEX idx_incidents_type_code
  ON incidents (type_code);
CREATE INDEX idx_incidents_created_by_user_id
  ON incidents (created_by_user_id);
CREATE INDEX idx_incidents_created_at
  ON incidents (created_at);
CREATE INDEX idx_referral_cases_student_id ON referral_cases(student_id);
CREATE INDEX idx_referral_cases_group_id ON referral_cases(group_id);
CREATE INDEX idx_referral_cases_created_by_user_id ON referral_cases(created_by_user_id);
CREATE INDEX idx_referral_cases_reason_code ON referral_cases(reason_code);
CREATE INDEX idx_referral_cases_status ON referral_cases(status);
CREATE INDEX idx_referral_cases_shared_with_support ON referral_cases(shared_with_support);
CREATE INDEX idx_referral_case_notes_case_id ON referral_case_notes(case_id);
CREATE INDEX idx_referral_case_notes_author_user_id ON referral_case_notes(author_user_id);
CREATE INDEX idx_subject_risk_status_course_id
    ON subject_risk_status(course_id);
CREATE INDEX idx_subject_risk_status_student_id
    ON subject_risk_status(student_id);
CREATE INDEX idx_subject_risk_status_risk_status
    ON subject_risk_status(risk_status);
CREATE INDEX idx_subject_risk_status_is_incomplete
    ON subject_risk_status(is_incomplete);
CREATE INDEX idx_referral_cases_target_area
ON referral_cases(target_area);
CREATE INDEX idx_referral_cases_closed_by_user_id
ON referral_cases(closed_by_user_id);
CREATE INDEX idx_referral_cases_reopened_by_user_id
ON referral_cases(reopened_by_user_id);
CREATE INDEX idx_referral_cases_related_teacher_user_id
ON referral_cases(related_teacher_user_id);
CREATE INDEX idx_referral_cases_last_status_changed_at
ON referral_cases(last_status_changed_at);
CREATE INDEX idx_referral_case_events_case_id
ON referral_case_events(case_id);
CREATE INDEX idx_referral_case_events_actor_user_id
ON referral_case_events(actor_user_id);
CREATE INDEX idx_referral_case_events_event_type
ON referral_case_events(event_type);
CREATE INDEX idx_referral_case_events_created_at
ON referral_case_events(created_at);
CREATE UNIQUE INDEX idx_course_grade_units_unique_course_sort_order
  ON course_grade_units (course_id, sort_order);
CREATE INDEX idx_course_grade_units_course_id
  ON course_grade_units (course_id);
CREATE UNIQUE INDEX idx_course_grade_entries_unique_unit_student
  ON course_grade_entries (grade_unit_id, student_id);
CREATE INDEX idx_course_grade_entries_course_id
  ON course_grade_entries (course_id);
CREATE INDEX idx_course_grade_entries_student_id
  ON course_grade_entries (student_id);
CREATE INDEX idx_course_grade_entries_grade_unit_id
  ON course_grade_entries (grade_unit_id);
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
CREATE INDEX idx_student_traffic_light_snapshots_student_id
  ON student_traffic_light_snapshots (student_id);
CREATE INDEX idx_student_traffic_light_snapshots_color
  ON student_traffic_light_snapshots (color);
CREATE INDEX idx_student_traffic_light_snapshots_calculated_at
  ON student_traffic_light_snapshots (calculated_at);
CREATE INDEX idx_incidents_status
  ON incidents (status);
CREATE INDEX idx_incidents_student_status
  ON incidents (student_id, status);
CREATE INDEX idx_incidents_closed_by_user_id
  ON incidents (closed_by_user_id);
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
CREATE INDEX idx_incident_notes_incident_id
  ON incident_notes (incident_id);
CREATE INDEX idx_incident_notes_author_user_id
  ON incident_notes (author_user_id);
CREATE INDEX idx_incident_notes_created_at
  ON incident_notes (created_at);
CREATE INDEX idx_incident_events_incident_id
  ON incident_events (incident_id);
CREATE INDEX idx_incident_events_actor_user_id
  ON incident_events (actor_user_id);
CREATE INDEX idx_incident_events_event_type
  ON incident_events (event_type);
CREATE INDEX idx_incident_events_created_at
  ON incident_events (created_at);
CREATE INDEX idx_referral_cases_incident_id
ON referral_cases(incident_id);
CREATE INDEX idx_referral_cases_created_from_role
ON referral_cases(created_from_role);
CREATE INDEX idx_referral_cases_incident_target_area
ON referral_cases(incident_id, target_area);
CREATE UNIQUE INDEX idx_referral_cases_unique_open_incident_area
ON referral_cases(incident_id, target_area)
WHERE incident_id IS NOT NULL
  AND status = 'OPEN';
CREATE INDEX idx_cycles_year
ON cycles(year);
CREATE INDEX idx_cycles_ordinal
ON cycles(ordinal);
CREATE INDEX idx_cycles_year_ordinal
ON cycles(year, ordinal);
CREATE INDEX idx_cycles_start_date
ON cycles(start_date);
CREATE INDEX idx_cycles_end_date
ON cycles(end_date);
CREATE INDEX idx_students_phone
ON students(phone);
CREATE INDEX idx_users_email
ON users(email);
CREATE INDEX idx_users_is_active
ON users(is_active);
CREATE INDEX idx_users_session_version
ON users(session_version);
CREATE INDEX idx_users_last_active_role
ON users(last_active_role);
CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at);
CREATE INDEX idx_notifications_context
  ON notifications (context_type, context_id);
CREATE TRIGGER trg_only_one_active_director_on_user_update
BEFORE UPDATE OF is_active ON users
WHEN NEW.is_active = 1
  AND EXISTS (
    SELECT 1
    FROM user_roles current_user_role
    INNER JOIN roles current_role
      ON current_role.id = current_user_role.role_id
    WHERE current_user_role.user_id = NEW.id
      AND current_role.code = 'DIRECTOR'
  )
  AND EXISTS (
    SELECT 1
    FROM users active_user
    INNER JOIN user_roles active_user_role
      ON active_user_role.user_id = active_user.id
    INNER JOIN roles active_role
      ON active_role.id = active_user_role.role_id
    WHERE active_role.code = 'DIRECTOR'
      AND active_user.is_active = 1
      AND active_user.id <> NEW.id
  )
BEGIN
  SELECT RAISE(ABORT, 'Only one active DIRECTOR is allowed');
END;
CREATE TRIGGER trg_only_one_active_director_on_role_insert
BEFORE INSERT ON user_roles
WHEN EXISTS (
    SELECT 1
    FROM roles inserted_role
    WHERE inserted_role.id = NEW.role_id
      AND inserted_role.code = 'DIRECTOR'
  )
  AND EXISTS (
    SELECT 1
    FROM users inserted_user
    WHERE inserted_user.id = NEW.user_id
      AND inserted_user.is_active = 1
  )
  AND EXISTS (
    SELECT 1
    FROM users active_user
    INNER JOIN user_roles active_user_role
      ON active_user_role.user_id = active_user.id
    INNER JOIN roles active_role
      ON active_role.id = active_user_role.role_id
    WHERE active_role.code = 'DIRECTOR'
      AND active_user.is_active = 1
      AND active_user.id <> NEW.user_id
  )
BEGIN
  SELECT RAISE(ABORT, 'Only one active DIRECTOR is allowed');
END;
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('001'),
  ('002'),
  ('003'),
  ('004'),
  ('005'),
  ('006'),
  ('008'),
  ('009'),
  ('010'),
  ('011'),
  ('012'),
  ('013'),
  ('014'),
  ('015'),
  ('016'),
  ('017'),
  ('018'),
  ('019'),
  ('020'),
  ('021'),
  ('022'),
  ('023'),
  ('024'),
  ('025');
