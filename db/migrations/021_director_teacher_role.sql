-- migrate:up

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT
  u.id AS user_id,
  teacher_role.id AS role_id
FROM users u
INNER JOIN user_roles director_user_role
  ON director_user_role.user_id = u.id
INNER JOIN roles director_role
  ON director_role.id = director_user_role.role_id
INNER JOIN roles teacher_role
  ON teacher_role.code = 'TEACHER'
WHERE director_role.code = 'DIRECTOR';

-- migrate:down

DELETE FROM user_roles
WHERE role_id = (
  SELECT id
  FROM roles
  WHERE code = 'TEACHER'
  LIMIT 1
)
AND user_id IN (
  SELECT u.id
  FROM users u
  INNER JOIN user_roles ur
    ON ur.user_id = u.id
  INNER JOIN roles r
    ON r.id = ur.role_id
  WHERE r.code = 'DIRECTOR'
);