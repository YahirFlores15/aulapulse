-- migrate:up

PRAGMA foreign_keys = OFF;

CREATE TABLE cycles_academic_automation_new (
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

INSERT INTO cycles_academic_automation_new (
  id,
  code,
  name,
  start_date,
  end_date,
  year,
  ordinal,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  printf(
    '%04d-%d',
    CAST(substr(start_date, 1, 4) AS INTEGER),
    CASE
      WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 1 AND 4 THEN 1
      WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 5 AND 8 THEN 2
      ELSE 3
    END
  ) AS code,
  CASE
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 1 AND 4
      THEN 'Enero - Abril ' || substr(start_date, 1, 4)
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 5 AND 8
      THEN 'Mayo - Agosto ' || substr(start_date, 1, 4)
    ELSE 'Septiembre - Diciembre ' || substr(start_date, 1, 4)
  END AS name,
  CASE
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 1 AND 4
      THEN substr(start_date, 1, 4) || '-01-01'
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 5 AND 8
      THEN substr(start_date, 1, 4) || '-05-01'
    ELSE substr(start_date, 1, 4) || '-09-01'
  END AS start_date,
  CASE
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 1 AND 4
      THEN substr(start_date, 1, 4) || '-04-30'
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 5 AND 8
      THEN substr(start_date, 1, 4) || '-08-31'
    ELSE substr(start_date, 1, 4) || '-12-31'
  END AS end_date,
  CAST(substr(start_date, 1, 4) AS INTEGER) AS year,
  CASE
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 1 AND 4 THEN 1
    WHEN CAST(substr(start_date, 6, 2) AS INTEGER) BETWEEN 5 AND 8 THEN 2
    ELSE 3
  END AS ordinal,
  is_active,
  created_at,
  CURRENT_TIMESTAMP
FROM cycles;

DROP TABLE cycles;

ALTER TABLE cycles_academic_automation_new RENAME TO cycles;

CREATE INDEX IF NOT EXISTS idx_cycles_year
ON cycles(year);

CREATE INDEX IF NOT EXISTS idx_cycles_ordinal
ON cycles(ordinal);

CREATE INDEX IF NOT EXISTS idx_cycles_year_ordinal
ON cycles(year, ordinal);

CREATE INDEX IF NOT EXISTS idx_cycles_start_date
ON cycles(start_date);

CREATE INDEX IF NOT EXISTS idx_cycles_end_date
ON cycles(end_date);

INSERT OR IGNORE INTO cycles (
  code,
  name,
  start_date,
  end_date,
  year,
  ordinal,
  is_active
)
VALUES
  ('2026-1', 'Enero - Abril 2026', '2026-01-01', '2026-04-30', 2026, 1, 1),
  ('2026-2', 'Mayo - Agosto 2026', '2026-05-01', '2026-08-31', 2026, 2, 1),
  ('2026-3', 'Septiembre - Diciembre 2026', '2026-09-01', '2026-12-31', 2026, 3, 1);

PRAGMA foreign_keys = ON;


-- migrate:down

PRAGMA foreign_keys = OFF;

CREATE TABLE cycles_academic_automation_rollback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cycles_academic_automation_rollback (
  id,
  code,
  name,
  start_date,
  end_date,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  code,
  name,
  start_date,
  end_date,
  is_active,
  created_at,
  updated_at
FROM cycles;

DROP TABLE cycles;

ALTER TABLE cycles_academic_automation_rollback RENAME TO cycles;

PRAGMA foreign_keys = ON;