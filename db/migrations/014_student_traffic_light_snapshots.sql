-- migrate:up

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

CREATE INDEX idx_student_traffic_light_snapshots_student_id
  ON student_traffic_light_snapshots (student_id);

CREATE INDEX idx_student_traffic_light_snapshots_color
  ON student_traffic_light_snapshots (color);

CREATE INDEX idx_student_traffic_light_snapshots_calculated_at
  ON student_traffic_light_snapshots (calculated_at);

-- migrate:down

DROP INDEX IF EXISTS idx_student_traffic_light_snapshots_calculated_at;
DROP INDEX IF EXISTS idx_student_traffic_light_snapshots_color;
DROP INDEX IF EXISTS idx_student_traffic_light_snapshots_student_id;

DROP TABLE IF EXISTS student_traffic_light_snapshots;