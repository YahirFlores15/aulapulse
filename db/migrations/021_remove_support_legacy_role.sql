-- migrate:up

UPDATE users
SET
  last_active_role = NULL,
  session_version = session_version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE last_active_role = 'SUPPORT';

DELETE FROM user_roles
WHERE role_id IN (
  SELECT id
  FROM roles
  WHERE code = 'SUPPORT'
);

DELETE FROM roles
WHERE code = 'SUPPORT';

-- migrate:down

INSERT OR IGNORE INTO roles (code, name)
VALUES ('SUPPORT', 'Soporte');
