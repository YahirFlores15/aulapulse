import { execute, query, queryOne, transaction } from "@/server/db/queries";


type IdRow = { id: number };

type RoleRow = {
    code: string;
};

type GroupCycleRow = {
    id: number;
    cycle_id: number;
};

type ExistingStudentByControlNumberRow = {
    id: number;
    control_number: string;
};

type UserWithRoleRow = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: number;
    must_change_password: number;
    created_at: string;
    role_code: string;
};

type TeacherCandidateRow = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: number;
};

type CycleRow = {
    id: number;
    code: string;
    name: string;
    start_date: string;
    end_date: string;
    year: number;
    ordinal: number;
    is_active: number;
    created_at: string;
    updated_at: string;
};

type GroupRow = {
    id: number;
    cycle_id: number;
    cycle_code: string;
    cycle_name: string;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
};

type SubjectRow = {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
};

type StudentRow = {
    id: number;
    control_number: string;
    first_name: string;
    last_name: string;
    second_last_name: string | null;
    email: string | null;
    phone: string | null;
    is_active: number;
    traffic_light: string | null;
    traffic_light_causes_json: string | null;
    traffic_light_calculated_at: string | null;
    red_causes_count: number | null;
    yellow_causes_count: number | null;
    created_at: string;
    updated_at: string;
};

type GroupStudentRow = {
    id: number;
    cycle_id: number;
    cycle_code: string;
    group_id: number;
    group_code: string;
    student_id: number;
    control_number: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    traffic_light: string | null;
    traffic_light_causes_json: string | null;
    traffic_light_calculated_at: string | null;
    red_causes_count: number | null;
    yellow_causes_count: number | null;
    assigned_at: string;
};

type CourseRow = {
    id: number;
    cycle_id: number;
    cycle_code: string;
    group_id: number;
    group_code: string;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    teacher_user_id: number;
    teacher_name: string;
    teacher_email: string;
    created_at: string;
    updated_at: string;
};

type GroupTutorRow = {
    id: number;
    group_id: number;
    group_code: string;
    group_name: string;
    tutor_user_id: number;
    tutor_name: string;
    tutor_email: string;
    created_at: string;
    updated_at: string;
};

export const directorRepo = {
    findUserByEmail(email: string) {
        return queryOne<{ id: number }>(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email],
        );
    },

    findUserById(userId: number) {
        return queryOne<UserWithRoleRow>(
            `
            SELECT
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.is_active,
              u.must_change_password,
              u.created_at,
              r.code AS role_code
            FROM users u
            INNER JOIN user_roles ur ON ur.user_id = u.id
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE u.id = ?
              AND r.code IN ('TEACHER', 'PEDAGOGIA', 'PSICOLOGIA')
            ORDER BY CASE r.code
              WHEN 'TEACHER' THEN 1
              WHEN 'PEDAGOGIA' THEN 2
              WHEN 'PSICOLOGIA' THEN 3
              ELSE 99
            END
            LIMIT 1
            `,
            [userId],
        );
    },

    listOperationalUsers() {
        return query<UserWithRoleRow>(
            `
            SELECT
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.is_active,
              u.must_change_password,
              u.created_at,
              r.code AS role_code
            FROM users u
            INNER JOIN user_roles ur ON ur.user_id = u.id
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE r.code IN ('TEACHER', 'PEDAGOGIA', 'PSICOLOGIA')
            ORDER BY u.created_at DESC, u.id DESC
            `,
        );
    },

    listTeacherCandidatesForTutorAssignment() {
        return query<TeacherCandidateRow>(
            `
            SELECT DISTINCT
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.is_active
            FROM users u
            INNER JOIN user_roles ur ON ur.user_id = u.id
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE r.code = 'TEACHER'
            ORDER BY u.first_name ASC, u.last_name ASC, u.id ASC
            `,
        );
    },

    createOperationalUser(params: {
        firstName: string;
        lastName: string;
        email: string;
        passwordHash: string;
        mustChangePassword: boolean;
        roleCode: string;
    }) {
        return transaction(() => {
            const result = execute(
                `
                INSERT INTO users (
                  first_name,
                  last_name,
                  email,
                  password_hash,
                  is_active,
                  must_change_password
                )
                VALUES (?, ?, ?, ?, 1, ?)
                `,
                [
                    params.firstName,
                    params.lastName,
                    params.email,
                    params.passwordHash,
                    params.mustChangePassword ? 1 : 0,
                ],
            );

            const insertedUserId = Number(result.lastInsertRowid);

            const role = queryOne<IdRow>(
                `
                SELECT id
                FROM roles
                WHERE code = ?
                LIMIT 1
                `,
                [params.roleCode],
            );

            if (!role) {
                throw new Error("ROLE_NOT_FOUND");
            }

            execute(
                `
                INSERT INTO user_roles (user_id, role_id)
                VALUES (?, ?)
                `,
                [insertedUserId, role.id],
            );

            return insertedUserId;
        });
    },

    updateOperationalUser(
        userId: number,
        params: {
            firstName?: string;
            lastName?: string;
            email?: string;
            isActive?: boolean;
            mustChangePassword?: boolean;
        },
    ) {
        const fields: string[] = [];
        const values: Array<string | number> = [];

        if (params.firstName !== undefined) {
            fields.push("first_name = ?");
            values.push(params.firstName);
        }

        if (params.lastName !== undefined) {
            fields.push("last_name = ?");
            values.push(params.lastName);
        }

        if (params.email !== undefined) {
            fields.push("email = ?");
            values.push(params.email);
        }

        if (params.isActive !== undefined) {
            fields.push("is_active = ?");
            values.push(params.isActive ? 1 : 0);
        }

        if (params.mustChangePassword !== undefined) {
            fields.push("must_change_password = ?");
            values.push(params.mustChangePassword ? 1 : 0);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        execute(
            `
            UPDATE users
            SET ${fields.join(", ")}
            WHERE id = ?
            `,
            [...values, userId],
        );
    },

    listCycles() {
        return query<CycleRow>(
            `
            SELECT
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
            FROM cycles
            ORDER BY year DESC, ordinal DESC, id DESC
            `,
        );
    },

    findCycleById(cycleId: number) {
        return queryOne<CycleRow>(
            `
            SELECT
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
            FROM cycles
            WHERE id = ?
            LIMIT 1
            `,
            [cycleId],
        );
    },

    findCycleByCode(code: string) {
        return queryOne<IdRow>(
            `
            SELECT id
            FROM cycles
            WHERE code = ?
            LIMIT 1
            `,
            [code],
        );
    },

    findCycleByYearAndOrdinal(year: number, ordinal: number) {
        return queryOne<CycleRow>(
            `
            SELECT
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
            FROM cycles
            WHERE year = ?
              AND ordinal = ?
            LIMIT 1
            `,
            [year, ordinal],
        );
    },

    createAutomaticCycle(params: {
        code: string;
        name: string;
        startDate: string;
        endDate: string;
        year: number;
        ordinal: number;
        isActive: boolean;
    }) {
        const result = execute(
            `
            INSERT INTO cycles (
              code,
              name,
              start_date,
              end_date,
              year,
              ordinal,
              is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                params.code,
                params.name,
                params.startDate,
                params.endDate,
                params.year,
                params.ordinal,
                params.isActive ? 1 : 0,
            ],
        );

        return Number(result.lastInsertRowid);
    },

    updateAutomaticCycle(
        cycleId: number,
        params: {
            code: string;
            name: string;
            startDate: string;
            endDate: string;
            year: number;
            ordinal: number;
            isActive: boolean;
        },
    ) {
        execute(
            `
            UPDATE cycles
            SET
              code = ?,
              name = ?,
              start_date = ?,
              end_date = ?,
              year = ?,
              ordinal = ?,
              is_active = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                params.code,
                params.name,
                params.startDate,
                params.endDate,
                params.year,
                params.ordinal,
                params.isActive ? 1 : 0,
                cycleId,
            ],
        );
    },

    listGroups() {
        return query<GroupRow>(
            `
            SELECT
              g.id,
              g.cycle_id,
              c.code AS cycle_code,
              c.name AS cycle_name,
              g.code,
              g.name,
              g.created_at,
              g.updated_at
            FROM groups g
            INNER JOIN cycles c ON c.id = g.cycle_id
            ORDER BY g.created_at DESC, g.id DESC
            `,
        );
    },

    findGroupById(groupId: number) {
        return queryOne<GroupRow>(
            `
            SELECT
              g.id,
              g.cycle_id,
              c.code AS cycle_code,
              c.name AS cycle_name,
              g.code,
              g.name,
              g.created_at,
              g.updated_at
            FROM groups g
            INNER JOIN cycles c ON c.id = g.cycle_id
            WHERE g.id = ?
            LIMIT 1
            `,
            [groupId],
        );
    },

    findGroupByCycleAndCode(cycleId: number, code: string) {
        return queryOne<IdRow>(
            `
            SELECT id
            FROM groups
            WHERE cycle_id = ? AND code = ?
            LIMIT 1
            `,
            [cycleId, code],
        );
    },

    createGroup(params: {
        cycleId: number;
        code: string;
        name: string;
    }) {
        const result = execute(
            `
            INSERT INTO groups (
              cycle_id,
              code,
              name
            )
            VALUES (?, ?, ?)
            `,
            [params.cycleId, params.code, params.name],
        );

        return Number(result.lastInsertRowid);
    },

    updateGroup(
        groupId: number,
        params: {
            code?: string;
            name?: string;
        },
    ) {
        const fields: string[] = [];
        const values: Array<string | number> = [];

        if (params.code !== undefined) {
            fields.push("code = ?");
            values.push(params.code);
        }

        if (params.name !== undefined) {
            fields.push("name = ?");
            values.push(params.name);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        execute(
            `
            UPDATE groups
            SET ${fields.join(", ")}
            WHERE id = ?
            `,
            [...values, groupId],
        );
    },

    listSubjects() {
        return query<SubjectRow>(
            `
            SELECT
              id,
              code,
              name,
              created_at,
              updated_at
            FROM subjects
            ORDER BY created_at DESC, id DESC
            `,
        );
    },

    findSubjectById(subjectId: number) {
        return queryOne<SubjectRow>(
            `
            SELECT
              id,
              code,
              name,
              created_at,
              updated_at
            FROM subjects
            WHERE id = ?
            LIMIT 1
            `,
            [subjectId],
        );
    },

    findSubjectByCode(code: string) {
        return queryOne<IdRow>(
            `
            SELECT id
            FROM subjects
            WHERE code = ?
            LIMIT 1
            `,
            [code],
        );
    },

    createSubject(params: {
        code: string;
        name: string;
    }) {
        const result = execute(
            `
            INSERT INTO subjects (
              code,
              name
            )
            VALUES (?, ?)
            `,
            [params.code, params.name],
        );

        return Number(result.lastInsertRowid);
    },

    updateSubject(
        subjectId: number,
        params: {
            code?: string;
            name?: string;
        },
    ) {
        const fields: string[] = [];
        const values: Array<string | number> = [];

        if (params.code !== undefined) {
            fields.push("code = ?");
            values.push(params.code);
        }

        if (params.name !== undefined) {
            fields.push("name = ?");
            values.push(params.name);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        execute(
            `
            UPDATE subjects
            SET ${fields.join(", ")}
            WHERE id = ?
            `,
            [...values, subjectId],
        );
    },

    listStudents(params?: { trafficLight?: string }) {
        const filters: string[] = [];
        const values: Array<string | number> = [];

        if (params?.trafficLight) {
            if (params.trafficLight === "NONE") {
                filters.push("tls.id IS NULL");
            } else {
                filters.push("tls.color = ?");
                values.push(params.trafficLight);
            }
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

        return query<StudentRow>(
            `
            SELECT
              s.id,
              s.control_number,
              s.first_name,
              s.last_name,
              s.second_last_name,
              s.email,
              s.phone,
              s.is_active,
              tls.color AS traffic_light,
              tls.causes_json AS traffic_light_causes_json,
              tls.calculated_at AS traffic_light_calculated_at,
              tls.red_causes_count,
              tls.yellow_causes_count,
              s.created_at,
              s.updated_at
            FROM students s
            LEFT JOIN student_traffic_light_snapshots tls ON tls.student_id = s.id
            ${whereClause}
            ORDER BY
              CASE tls.color
                WHEN 'RED' THEN 1
                WHEN 'YELLOW' THEN 2
                WHEN 'GREEN' THEN 3
                ELSE 4
              END,
              s.created_at DESC,
              s.id DESC
            `,
            values,
        );
    },

    findStudentById(studentId: number) {
        return queryOne<StudentRow>(
            `
            SELECT
              s.id,
              s.control_number,
              s.first_name,
              s.last_name,
              s.second_last_name,
              s.email,
              s.phone,
              s.is_active,
              tls.color AS traffic_light,
              tls.causes_json AS traffic_light_causes_json,
              tls.calculated_at AS traffic_light_calculated_at,
              tls.red_causes_count,
              tls.yellow_causes_count,
              s.created_at,
              s.updated_at
            FROM students s
            LEFT JOIN student_traffic_light_snapshots tls ON tls.student_id = s.id
            WHERE s.id = ?
            LIMIT 1
            `,
            [studentId],
        );
    },

    findStudentByControlNumber(controlNumber: string) {
        return queryOne<ExistingStudentByControlNumberRow>(
            `
            SELECT id, control_number
            FROM students
            WHERE control_number = ?
            LIMIT 1
            `,
            [controlNumber],
        );
    },

    findStudentsByControlNumbers(controlNumbers: string[]) {
        if (controlNumbers.length === 0) {
            return [];
        }

        const placeholders = controlNumbers.map(() => "?").join(", ");

        return query<ExistingStudentByControlNumberRow>(
            `
            SELECT id, control_number
            FROM students
            WHERE control_number IN (${placeholders})
            `,
            controlNumbers,
        );
    },

    findGroupCycle(groupId: number) {
        return queryOne<GroupCycleRow>(
            `
            SELECT id, cycle_id
            FROM groups
            WHERE id = ?
            LIMIT 1
            `,
            [groupId],
        );
    },

    createStudentWithAssignment(params: {
        controlNumber: string;
        firstName: string;
        lastName: string;
        secondLastName: string | null;
        email: string | null;
        phone: string | null;
        groupId: number;
        cycleId: number;
    }) {
        return transaction(() => {
            const result = execute(
                `
                INSERT INTO students (
                  control_number,
                  first_name,
                  last_name,
                  second_last_name,
                  email,
                  phone
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    params.controlNumber,
                    params.firstName,
                    params.lastName,
                    params.secondLastName,
                    params.email,
                    params.phone,
                ],
            );

            const studentId = Number(result.lastInsertRowid);

            execute(
                `
                INSERT INTO group_students (
                  cycle_id,
                  group_id,
                  student_id
                )
                VALUES (?, ?, ?)
                `,
                [params.cycleId, params.groupId, studentId],
            );

            return studentId;
        });
    },

    bulkCreateStudentsWithAssignment(params: {
        groupId: number;
        cycleId: number;
        rows: Array<{
            rowNumber: number;
            controlNumber: string;
            firstName: string;
            lastName: string;
            secondLastName: string | null;
            email: string | null;
            phone: string | null;
        }>;
    }) {
        return transaction(() => {
            let createdStudents = 0;
            let assignedStudents = 0;

            const importedStudents: Array<{
                rowNumber: number;
                studentId: number;
                controlNumber: string;
            }> = [];

            for (const row of params.rows) {
                const result = execute(
                    `
                    INSERT INTO students (
                      control_number,
                      first_name,
                      last_name,
                      second_last_name,
                      email,
                      phone
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        row.controlNumber,
                        row.firstName,
                        row.lastName,
                        row.secondLastName,
                        row.email,
                        row.phone,
                    ],
                );

                const studentId = Number(result.lastInsertRowid);
                createdStudents += 1;

                execute(
                    `
                    INSERT INTO group_students (
                      cycle_id,
                      group_id,
                      student_id
                    )
                    VALUES (?, ?, ?)
                    `,
                    [params.cycleId, params.groupId, studentId],
                );

                assignedStudents += 1;

                importedStudents.push({
                    rowNumber: row.rowNumber,
                    studentId,
                    controlNumber: row.controlNumber,
                });
            }

            return {
                createdStudents,
                assignedStudents,
                importedStudents,
            };
        });
    },

    updateStudent(
        studentId: number,
        params: {
            firstName?: string;
            lastName?: string;
            secondLastName?: string | null;
            email?: string | null;
            phone?: string | null;
            isActive?: boolean;
        },
    ) {
        const fields: string[] = [];
        const values: Array<string | number | null> = [];

        if (params.firstName !== undefined) {
            fields.push("first_name = ?");
            values.push(params.firstName);
        }

        if (params.lastName !== undefined) {
            fields.push("last_name = ?");
            values.push(params.lastName);
        }

        if (params.secondLastName !== undefined) {
            fields.push("second_last_name = ?");
            values.push(params.secondLastName);
        }

        if (params.email !== undefined) {
            fields.push("email = ?");
            values.push(params.email);
        }

        if (params.phone !== undefined) {
            fields.push("phone = ?");
            values.push(params.phone);
        }

        if (params.isActive !== undefined) {
            fields.push("is_active = ?");
            values.push(params.isActive ? 1 : 0);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        execute(
            `
            UPDATE students
            SET ${fields.join(", ")}
            WHERE id = ?
            `,
            [...values, studentId],
        );
    },

    listStudentsByGroup(groupId: number, params?: { trafficLight?: string }) {
        const filters: string[] = ["gs.group_id = ?"];
        const values: Array<string | number> = [groupId];

        if (params?.trafficLight) {
            if (params.trafficLight === "NONE") {
                filters.push("tls.id IS NULL");
            } else {
                filters.push("tls.color = ?");
                values.push(params.trafficLight);
            }
        }

        return query<GroupStudentRow>(
            `
            SELECT
              gs.id,
              gs.cycle_id,
              c.code AS cycle_code,
              gs.group_id,
              g.code AS group_code,
              gs.student_id,
              s.control_number,
              TRIM(s.first_name || ' ' || s.last_name || ' ' || COALESCE(s.second_last_name, '')) AS full_name,
              s.email,
              s.phone,
              tls.color AS traffic_light,
              tls.causes_json AS traffic_light_causes_json,
              tls.calculated_at AS traffic_light_calculated_at,
              tls.red_causes_count,
              tls.yellow_causes_count,
              gs.created_at AS assigned_at
            FROM group_students gs
            INNER JOIN cycles c ON c.id = gs.cycle_id
            INNER JOIN groups g ON g.id = gs.group_id
            INNER JOIN students s ON s.id = gs.student_id
            LEFT JOIN student_traffic_light_snapshots tls ON tls.student_id = s.id
            WHERE ${filters.join(" AND ")}
            ORDER BY
              CASE tls.color
                WHEN 'RED' THEN 1
                WHEN 'YELLOW' THEN 2
                WHEN 'GREEN' THEN 3
                ELSE 4
              END,
              s.last_name ASC,
              s.first_name ASC,
              s.id ASC
            `,
            values,
        );
    },

    listCoursesByCycle(cycleId: number) {
        return query<CourseRow>(
            `
            SELECT
              co.id,
              co.cycle_id,
              cy.code AS cycle_code,
              co.group_id,
              g.code AS group_code,
              co.subject_id,
              s.code AS subject_code,
              s.name AS subject_name,
              co.teacher_user_id,
              TRIM(u.first_name || ' ' || u.last_name) AS teacher_name,
              u.email AS teacher_email,
              co.created_at,
              co.updated_at
            FROM courses co
            INNER JOIN cycles cy ON cy.id = co.cycle_id
            INNER JOIN groups g ON g.id = co.group_id
            INNER JOIN subjects s ON s.id = co.subject_id
            INNER JOIN users u ON u.id = co.teacher_user_id
            WHERE co.cycle_id = ?
            ORDER BY co.created_at DESC, co.id DESC
            `,
            [cycleId],
        );
    },

    findCourseDuplicate(params: {
        cycleId: number;
        groupId: number;
        subjectId: number;
        teacherUserId: number;
    }) {
        return queryOne<IdRow>(
            `
            SELECT id
            FROM courses
            WHERE cycle_id = ?
              AND group_id = ?
              AND subject_id = ?
              AND teacher_user_id = ?
            LIMIT 1
            `,
            [
                params.cycleId,
                params.groupId,
                params.subjectId,
                params.teacherUserId,
            ],
        );
    },

    createCourse(params: {
        cycleId: number;
        groupId: number;
        subjectId: number;
        teacherUserId: number;
    }) {
        const result = execute(
            `
            INSERT INTO courses (
              cycle_id,
              group_id,
              subject_id,
              teacher_user_id
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                params.cycleId,
                params.groupId,
                params.subjectId,
                params.teacherUserId,
            ],
        );

        return Number(result.lastInsertRowid);
    },

    findCourseById(courseId: number) {
        return queryOne<CourseRow>(
            `
            SELECT
              co.id,
              co.cycle_id,
              cy.code AS cycle_code,
              co.group_id,
              g.code AS group_code,
              co.subject_id,
              s.code AS subject_code,
              s.name AS subject_name,
              co.teacher_user_id,
              TRIM(u.first_name || ' ' || u.last_name) AS teacher_name,
              u.email AS teacher_email,
              co.created_at,
              co.updated_at
            FROM courses co
            INNER JOIN cycles cy ON cy.id = co.cycle_id
            INNER JOIN groups g ON g.id = co.group_id
            INNER JOIN subjects s ON s.id = co.subject_id
            INNER JOIN users u ON u.id = co.teacher_user_id
            WHERE co.id = ?
            LIMIT 1
            `,
            [courseId],
        );
    },

    listGroupTutors() {
        return query<GroupTutorRow>(
            `
            SELECT
              gt.id,
              gt.group_id,
              g.code AS group_code,
              g.name AS group_name,
              gt.tutor_user_id,
              TRIM(u.first_name || ' ' || u.last_name) AS tutor_name,
              u.email AS tutor_email,
              gt.created_at,
              gt.updated_at
            FROM group_tutors gt
            INNER JOIN groups g ON g.id = gt.group_id
            INNER JOIN users u ON u.id = gt.tutor_user_id
            ORDER BY gt.created_at DESC, gt.id DESC
            `,
        );
    },

    findGroupTutorByGroupId(groupId: number) {
        return queryOne<GroupTutorRow>(
            `
            SELECT
              gt.id,
              gt.group_id,
              g.code AS group_code,
              g.name AS group_name,
              gt.tutor_user_id,
              TRIM(u.first_name || ' ' || u.last_name) AS tutor_name,
              u.email AS tutor_email,
              gt.created_at,
              gt.updated_at
            FROM group_tutors gt
            INNER JOIN groups g ON g.id = gt.group_id
            INNER JOIN users u ON u.id = gt.tutor_user_id
            WHERE gt.group_id = ?
            LIMIT 1
            `,
            [groupId],
        );
    },

    findAnyGroupTutorByTutorUserId(tutorUserId: number) {
        return queryOne<IdRow>(
            `
            SELECT id
            FROM group_tutors
            WHERE tutor_user_id = ?
            LIMIT 1
            `,
            [tutorUserId],
        );
    },

    assignTutor(params: {
        groupId: number;
        tutorUserId: number;
    }) {
        return transaction(() => {
            const previous = queryOne<{ tutor_user_id: number }>(
                `
                SELECT tutor_user_id
                FROM group_tutors
                WHERE group_id = ?
                LIMIT 1
                `,
                [params.groupId],
            );

            execute(
                `
                INSERT INTO group_tutors (
                  group_id,
                  tutor_user_id
                )
                VALUES (?, ?)
                ON CONFLICT(group_id) DO UPDATE SET
                  tutor_user_id = excluded.tutor_user_id,
                  updated_at = CURRENT_TIMESTAMP
                `,
                [params.groupId, params.tutorUserId],
            );

            return previous?.tutor_user_id ?? null;
        });
    },

    getUserRoles(userId: number) {
        return query<RoleRow>(
            `
            SELECT r.code
            FROM user_roles ur
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = ?
            ORDER BY r.code ASC
            `,
            [userId],
        );
    },

    addRoleToUser(userId: number, roleCode: string) {
        const role = queryOne<IdRow>(
            `
            SELECT id
            FROM roles
            WHERE code = ?
            LIMIT 1
            `,
            [roleCode],
        );

        if (!role) {
            throw new Error("ROLE_NOT_FOUND");
        }

        execute(
            `
            INSERT OR IGNORE INTO user_roles (user_id, role_id)
            VALUES (?, ?)
            `,
            [userId, role.id],
        );
    },

    removeRoleFromUser(userId: number, roleCode: string) {
        execute(
            `
            DELETE FROM user_roles
            WHERE user_id = ?
              AND role_id = (
                SELECT id
                FROM roles
                WHERE code = ?
                LIMIT 1
              )
            `,
            [userId, roleCode],
        );
    },
};