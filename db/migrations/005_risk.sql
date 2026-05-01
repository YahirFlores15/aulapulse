-- migrate:up

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
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE (course_id, student_id)
);

CREATE INDEX idx_subject_risk_status_course_id
    ON subject_risk_status(course_id);

CREATE INDEX idx_subject_risk_status_student_id
    ON subject_risk_status(student_id);

CREATE INDEX idx_subject_risk_status_risk_status
    ON subject_risk_status(risk_status);

-- migrate:down

DROP INDEX IF EXISTS idx_subject_risk_status_risk_status;
DROP INDEX IF EXISTS idx_subject_risk_status_student_id;
DROP INDEX IF EXISTS idx_subject_risk_status_course_id;

DROP TABLE IF EXISTS subject_risk_status;