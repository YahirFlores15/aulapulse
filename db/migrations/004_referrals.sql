-- migrate:up

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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE INDEX idx_referral_cases_student_id ON referral_cases(student_id);
CREATE INDEX idx_referral_cases_group_id ON referral_cases(group_id);
CREATE INDEX idx_referral_cases_created_by_user_id ON referral_cases(created_by_user_id);
CREATE INDEX idx_referral_cases_reason_code ON referral_cases(reason_code);
CREATE INDEX idx_referral_cases_status ON referral_cases(status);
CREATE INDEX idx_referral_cases_shared_with_support ON referral_cases(shared_with_support);

CREATE INDEX idx_referral_case_notes_case_id ON referral_case_notes(case_id);
CREATE INDEX idx_referral_case_notes_author_user_id ON referral_case_notes(author_user_id);

-- migrate:down

DROP INDEX IF EXISTS idx_referral_case_notes_author_user_id;
DROP INDEX IF EXISTS idx_referral_case_notes_case_id;

DROP INDEX IF EXISTS idx_referral_cases_shared_with_support;
DROP INDEX IF EXISTS idx_referral_cases_status;
DROP INDEX IF EXISTS idx_referral_cases_reason_code;
DROP INDEX IF EXISTS idx_referral_cases_created_by_user_id;
DROP INDEX IF EXISTS idx_referral_cases_group_id;
DROP INDEX IF EXISTS idx_referral_cases_student_id;

DROP TABLE IF EXISTS referral_case_notes;
DROP TABLE IF EXISTS referral_cases;
DROP TABLE IF EXISTS referral_reason_catalog;