PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- ============================================================
-- 1. Limpiar notificaciones e historial transversal
-- ============================================================

DELETE FROM notifications;

-- ============================================================
-- 2. Limpiar canalizaciones
-- ============================================================

DELETE FROM referral_case_events;
DELETE FROM referral_case_notes;

-- Esta tabla puede existir por migraciones anteriores.
-- Si no existe en tu schema actual, comenta esta línea.
-- DELETE FROM referral_case_targets;

DELETE FROM referral_cases;

-- ============================================================
-- 3. Limpiar incidencias
-- ============================================================

DELETE FROM incident_events;
DELETE FROM incident_notes;
DELETE FROM incidents;

-- ============================================================
-- 4. Limpiar semáforo / riesgo
-- ============================================================

DELETE FROM student_traffic_light_snapshots;
DELETE FROM subject_risk_status;

-- ============================================================
-- 5. Limpiar calificaciones
-- ============================================================

DELETE FROM course_grade_entries;
DELETE FROM course_grade_units;

-- Tabla legacy de calificaciones por parcial.
DELETE FROM grades;

-- ============================================================
-- 6. Limpiar asistencias
-- ============================================================

DELETE FROM course_attendance_non_applicable_days;
DELETE FROM attendance_records;

-- ============================================================
-- 7. Limpiar asignaciones académicas
-- ============================================================

DELETE FROM group_tutors;
DELETE FROM group_students;
DELETE FROM courses;

-- ============================================================
-- 8. Limpiar estructura académica operativa
-- ============================================================

DELETE FROM students;
DELETE FROM groups;
DELETE FROM subjects;
DELETE FROM cycles;

-- ============================================================
-- 9. Eliminar usuarios excepto Superusuario
-- ============================================================

-- Primero eliminar roles de usuarios que NO sean superusuarios.
DELETE FROM user_roles
WHERE user_id NOT IN (
    SELECT ur.user_id
    FROM user_roles ur
    WHERE ur.role_code = 'SUPERUSER'
);

-- Luego eliminar usuarios que NO tengan rol SUPERUSER.
DELETE FROM users
WHERE id NOT IN (
    SELECT ur.user_id
    FROM user_roles ur
    WHERE ur.role_code = 'SUPERUSER'
);

-- Asegurar que el superusuario quede con modo activo SUPERUSER.
UPDATE users
SET
    last_active_role = 'SUPERUSER',
    session_version = session_version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT ur.user_id
    FROM user_roles ur
    WHERE ur.role_code = 'SUPERUSER'
);

-- ============================================================
-- 10. Reiniciar autoincrement de tablas operativas vaciadas
-- ============================================================

DELETE FROM sqlite_sequence
WHERE name IN (
    'notifications',
    'referral_case_events',
    'referral_case_notes',
    'referral_case_targets',
    'referral_cases',
    'incident_events',
    'incident_notes',
    'incidents',
    'student_traffic_light_snapshots',
    'subject_risk_status',
    'course_grade_entries',
    'course_grade_units',
    'grades',
    'course_attendance_non_applicable_days',
    'attendance_records',
    'group_tutors',
    'group_students',
    'courses',
    'students',
    'groups',
    'subjects',
    'cycles'
);

COMMIT;

PRAGMA foreign_keys = ON;
