-- migrate:up

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT
  director_users.id AS user_id,
  teacher_role.id AS role_id
FROM users director_users
INNER JOIN user_roles director_user_roles
  ON director_user_roles.user_id = director_users.id
INNER JOIN roles director_role
  ON director_role.id = director_user_roles.role_id
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
  SELECT director_users.id
  FROM users director_users
  INNER JOIN user_roles director_user_roles
    ON director_user_roles.user_id = director_users.id
  INNER JOIN roles director_role
    ON director_role.id = director_user_roles.role_id
  WHERE director_role.code = 'DIRECTOR'
);
