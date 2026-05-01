-- migrate:up

ALTER TABLE subject_risk_status
ADD COLUMN is_incomplete INTEGER NOT NULL DEFAULT 1 CHECK (is_incomplete IN (0, 1));

UPDATE subject_risk_status
SET is_incomplete = CASE
    WHEN average_score IS NULL THEN 1
    ELSE 0
END;

CREATE INDEX IF NOT EXISTS idx_subject_risk_status_is_incomplete
    ON subject_risk_status(is_incomplete);

-- migrate:down

DROP INDEX IF EXISTS idx_subject_risk_status_is_incomplete;

ALTER TABLE subject_risk_status
DROP COLUMN is_incomplete;