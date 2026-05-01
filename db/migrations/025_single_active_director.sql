-- migrate:up

DROP TRIGGER IF EXISTS trg_only_one_active_director_on_user_update;
DROP TRIGGER IF EXISTS trg_only_one_active_director_on_role_insert;

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

-- migrate:down

DROP TRIGGER IF EXISTS trg_only_one_active_director_on_user_update;
DROP TRIGGER IF EXISTS trg_only_one_active_director_on_role_insert;