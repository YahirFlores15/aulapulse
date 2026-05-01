-- migrate:up

ALTER TABLE referral_cases
ADD COLUMN incident_id INTEGER NULL
REFERENCES incidents(id) ON DELETE SET NULL;

ALTER TABLE referral_cases
ADD COLUMN academic_context_json TEXT NULL;

ALTER TABLE referral_cases
ADD COLUMN created_from_role TEXT NULL
CHECK (
  created_from_role IS NULL OR
  created_from_role IN ('TEACHER', 'TUTOR')
);

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


-- migrate:down

DROP INDEX IF EXISTS idx_referral_cases_unique_open_incident_area;
DROP INDEX IF EXISTS idx_referral_cases_incident_target_area;
DROP INDEX IF EXISTS idx_referral_cases_created_from_role;
DROP INDEX IF EXISTS idx_referral_cases_incident_id;

ALTER TABLE referral_cases DROP COLUMN created_from_role;
ALTER TABLE referral_cases DROP COLUMN academic_context_json;
ALTER TABLE referral_cases DROP COLUMN incident_id;