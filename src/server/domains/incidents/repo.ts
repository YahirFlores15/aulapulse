import type { IncidentEventTypeDto, IncidentListItemDto, IncidentNoteDto, IncidentSourceRoleDto, IncidentStatusDto, IncidentTypeDto, } from "@/shared/dtos/incidents/incidents.dto";
import { execute, query, queryOne, transaction } from "@/server/db/queries";
import type { RoleCode } from "@/shared/enums/roles";


type IncidentTypeRow = {
    code: string;
    name: string;
    is_active: number;
};

type UserIdentityRow = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
};

type StudentIdentityRow = {
    id: number;
    control_number: string;
    first_name: string;
    last_name: string;
    second_last_name: string | null;
};

type CourseContextRow = {
    course_id: number;
    cycle_id: number;
    group_id: number;
    group_code: string;
    group_name: string;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    teacher_user_id: number;
};

type GroupContextRow = {
    group_id: number;
    cycle_id: number;
    group_code: string;
    group_name: string;
};

type IncidentRow = {
    id: number;
    student_id: number;
    student_control_number: string;
    student_first_name: string;
    student_last_name: string;
    student_second_last_name: string | null;
    type_code: string;
    type_name: string;
    note: string;
    status: IncidentStatusDto;
    course_id: number | null;
    subject_id: number | null;
    subject_code: string | null;
    subject_name: string | null;
    group_id: number | null;
    group_code: string | null;
    group_name: string | null;
    created_by_user_id: number;
    created_by_first_name: string;
    created_by_last_name: string;
    source_role: IncidentSourceRoleDto | null;
    created_at: string;
    updated_at: string | null;
    closed_at: string | null;
    closed_by_user_id: number | null;
    closed_by_first_name: string | null;
    closed_by_last_name: string | null;
    reopened_at: string | null;
    reopened_by_user_id: number | null;
    reopened_by_first_name: string | null;
    reopened_by_last_name: string | null;
    last_status_changed_at: string | null;
};

type IncidentNoteRow = {
    id: number;
    incident_id: number;
    author_user_id: number;
    author_first_name: string;
    author_last_name: string;
    note: string;
    created_at: string;
};

type IncidentEventRow = {
    id: number;
    incident_id: number;
    event_type: IncidentEventTypeDto;
    actor_user_id: number;
    actor_first_name: string;
    actor_last_name: string;
    from_value: string | null;
    to_value: string | null;
    note: string | null;
    created_at: string;
};

type RecipientRow = {
    user_id: number;
};

function buildFullName(input: {
    firstName: string | null;
    lastName: string | null;
    secondLastName?: string | null;
}) {
    return [input.firstName, input.lastName, input.secondLastName]
        .filter(Boolean)
        .join(" ")
        .trim();
}

function mapIncidentTypeRow(row: IncidentTypeRow): IncidentTypeDto {
    return {
        code: row.code,
        name: row.name,
        isActive: row.is_active === 1,
    };
}

function mapIncidentRow(row: IncidentRow): IncidentListItemDto {
    return {
        id: row.id,
        studentId: row.student_id,
        studentControlNumber: row.student_control_number,
        studentFullName: buildFullName({
            firstName: row.student_first_name,
            lastName: row.student_last_name,
            secondLastName: row.student_second_last_name,
        }),
        typeCode: row.type_code,
        typeName: row.type_name,
        note: row.note,
        status: row.status,
        courseId: row.course_id,
        subjectId: row.subject_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
        createdByUserId: row.created_by_user_id,
        createdByName: buildFullName({
            firstName: row.created_by_first_name,
            lastName: row.created_by_last_name,
        }),
        sourceRole: row.source_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        closedAt: row.closed_at,
        closedByUserId: row.closed_by_user_id,
        closedByName:
            row.closed_by_user_id !== null
                ? buildFullName({
                    firstName: row.closed_by_first_name,
                    lastName: row.closed_by_last_name,
                })
                : null,
        reopenedAt: row.reopened_at,
        reopenedByUserId: row.reopened_by_user_id,
        reopenedByName:
            row.reopened_by_user_id !== null
                ? buildFullName({
                    firstName: row.reopened_by_first_name,
                    lastName: row.reopened_by_last_name,
                })
                : null,
        lastStatusChangedAt: row.last_status_changed_at,
    };
}

function mapIncidentNoteRow(row: IncidentNoteRow): IncidentNoteDto {
    return {
        id: row.id,
        incidentId: row.incident_id,
        authorUserId: row.author_user_id,
        authorName: buildFullName({
            firstName: row.author_first_name,
            lastName: row.author_last_name,
        }),
        note: row.note,
        createdAt: row.created_at,
    };
}

function mapIncidentEventRow(row: IncidentEventRow) {
    return {
        id: row.id,
        incidentId: row.incident_id,
        eventType: row.event_type,
        actorUserId: row.actor_user_id,
        actorName: buildFullName({
            firstName: row.actor_first_name,
            lastName: row.actor_last_name,
        }),
        fromValue: row.from_value,
        toValue: row.to_value,
        note: row.note,
        createdAt: row.created_at,
    };
}

function getIncidentBaseSelect() {
    return `
        SELECT
            i.id,
            i.student_id,
            s.control_number AS student_control_number,
            s.first_name AS student_first_name,
            s.last_name AS student_last_name,
            s.second_last_name AS student_second_last_name,
            i.type_code,
            it.name AS type_name,
            i.note,
            i.status,
            i.course_id,
            sub.id AS subject_id,
            sub.code AS subject_code,
            sub.name AS subject_name,
            i.group_id,
            g.code AS group_code,
            g.name AS group_name,
            i.created_by_user_id,
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            i.source_role,
            i.created_at,
            i.updated_at,
            i.closed_at,
            i.closed_by_user_id,
            closer.first_name AS closed_by_first_name,
            closer.last_name AS closed_by_last_name,
            i.reopened_at,
            i.reopened_by_user_id,
            reopener.first_name AS reopened_by_first_name,
            reopener.last_name AS reopened_by_last_name,
            i.last_status_changed_at
        FROM incidents i
        INNER JOIN students s
            ON s.id = i.student_id
        INNER JOIN incident_types it
            ON it.code = i.type_code
        INNER JOIN users creator
            ON creator.id = i.created_by_user_id
        LEFT JOIN courses c
            ON c.id = i.course_id
        LEFT JOIN subjects sub
            ON sub.id = c.subject_id
        LEFT JOIN groups g
            ON g.id = COALESCE(i.group_id, c.group_id)
        LEFT JOIN users closer
            ON closer.id = i.closed_by_user_id
        LEFT JOIN users reopener
            ON reopener.id = i.reopened_by_user_id
    `;
}

export function getIncidentTypeByCode(code: string): IncidentTypeDto | null {
    const row = queryOne<IncidentTypeRow>(
        `
        SELECT
            code,
            name,
            is_active
        FROM incident_types
        WHERE code = ?
        LIMIT 1
        `,
        [code],
    );

    return row ? mapIncidentTypeRow(row) : null;
}

export function listIncidentTypes(): IncidentTypeDto[] {
    return query<IncidentTypeRow>(
        `
        SELECT
            code,
            name,
            is_active
        FROM incident_types
        ORDER BY name ASC
        `,
    ).map(mapIncidentTypeRow);
}

export function getUserIdentity(userId: number): UserIdentityRow | null {
    return queryOne<UserIdentityRow>(
        `
        SELECT
            id,
            first_name,
            last_name,
            email
        FROM users
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
        `,
        [userId],
    ) ?? null;
}

export function getStudentIdentity(studentId: number): StudentIdentityRow | null {
    return queryOne<StudentIdentityRow>(
        `
        SELECT
            id,
            control_number,
            first_name,
            last_name,
            second_last_name
        FROM students
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
        `,
        [studentId],
    ) ?? null;
}

export function getCourseContext(courseId: number): CourseContextRow | null {
    return queryOne<CourseContextRow>(
        `
        SELECT
            c.id AS course_id,
            c.cycle_id,
            c.group_id,
            g.code AS group_code,
            g.name AS group_name,
            s.id AS subject_id,
            s.code AS subject_code,
            s.name AS subject_name,
            c.teacher_user_id
        FROM courses c
        INNER JOIN groups g
            ON g.id = c.group_id
        INNER JOIN subjects s
            ON s.id = c.subject_id
        WHERE c.id = ?
        LIMIT 1
        `,
        [courseId],
    ) ?? null;
}

export function getGroupContext(groupId: number): GroupContextRow | null {
    return queryOne<GroupContextRow>(
        `
        SELECT
            id AS group_id,
            cycle_id,
            code AS group_code,
            name AS group_name
        FROM groups
        WHERE id = ?
        LIMIT 1
        `,
        [groupId],
    ) ?? null;
}

export function studentBelongsToCourse(courseId: number, studentId: number): boolean {
    const row = queryOne<{ found: number }>(
        `
        SELECT 1 AS found
        FROM courses c
        INNER JOIN group_students gs
            ON gs.group_id = c.group_id
           AND gs.cycle_id = c.cycle_id
        WHERE c.id = ?
          AND gs.student_id = ?
        LIMIT 1
        `,
        [courseId, studentId],
    );

    return Boolean(row);
}

export function studentBelongsToGroup(groupId: number, studentId: number): boolean {
    const row = queryOne<{ found: number }>(
        `
        SELECT 1 AS found
        FROM group_students
        WHERE group_id = ?
          AND student_id = ?
        LIMIT 1
        `,
        [groupId, studentId],
    );

    return Boolean(row);
}

export function teacherOwnsCourse(courseId: number, teacherUserId: number): boolean {
    const row = queryOne<{ found: number }>(
        `
        SELECT 1 AS found
        FROM courses
        WHERE id = ?
          AND teacher_user_id = ?
        LIMIT 1
        `,
        [courseId, teacherUserId],
    );

    return Boolean(row);
}

export function tutorOwnsGroup(groupId: number, tutorUserId: number): boolean {
    const row = queryOne<{ found: number }>(
        `
        SELECT 1 AS found
        FROM group_tutors
        WHERE group_id = ?
          AND tutor_user_id = ?
        LIMIT 1
        `,
        [groupId, tutorUserId],
    );

    return Boolean(row);
}

export function tutorCanAccessCourse(
    courseId: number,
    tutorUserId: number,
): boolean {
    const row = queryOne<{ found: number }>(
        `
        SELECT 1 AS found
        FROM courses c
        INNER JOIN group_tutors gt
            ON gt.group_id = c.group_id
        WHERE c.id = ?
          AND gt.tutor_user_id = ?
        LIMIT 1
        `,
        [courseId, tutorUserId],
    );

    return Boolean(row);
}

export function getPrimaryGroupForStudent(studentId: number): GroupContextRow | null {
    return queryOne<GroupContextRow>(
        `
        SELECT
            g.id AS group_id,
            g.cycle_id,
            g.code AS group_code,
            g.name AS group_name
        FROM group_students gs
        INNER JOIN groups g
            ON g.id = gs.group_id
        INNER JOIN cycles c
            ON c.id = gs.cycle_id
        WHERE gs.student_id = ?
        ORDER BY c.start_date DESC, g.id DESC
        LIMIT 1
        `,
        [studentId],
    ) ?? null;
}

export function createIncident(input: {
    studentId: number;
    typeCode: string;
    createdByUserId: number;
    note: string;
    status: IncidentStatusDto;
    courseId: number | null;
    groupId: number | null;
    sourceRole: IncidentSourceRoleDto;
}): number {
    return transaction(() => {
        const result = execute(
            `
            INSERT INTO incidents (
                student_id,
                type_code,
                created_by_user_id,
                note,
                status,
                course_id,
                group_id,
                source_role,
                updated_at,
                last_status_changed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            [
                input.studentId,
                input.typeCode,
                input.createdByUserId,
                input.note,
                input.status,
                input.courseId,
                input.groupId,
                input.sourceRole,
            ],
        );

        const incidentId = Number(result.lastInsertRowid);

        createIncidentEvent({
            incidentId,
            eventType: "INCIDENT_CREATED",
            actorUserId: input.createdByUserId,
            fromValue: null,
            toValue: input.status,
            note: "Incidencia registrada.",
        });

        return incidentId;
    });
}

export function getIncidentById(incidentId: number): IncidentListItemDto | null {
    const row = queryOne<IncidentRow>(
        `
        ${getIncidentBaseSelect()}
        WHERE i.id = ?
        LIMIT 1
        `,
        [incidentId],
    );

    return row ? mapIncidentRow(row) : null;
}

export function listIncidentsForDirector(input?: {
    status?: IncidentStatusDto | "ALL";
    studentId?: number;
    courseId?: number;
    groupId?: number;
}): IncidentListItemDto[] {
    const filters: string[] = [];
    const params: Array<string | number> = [];

    if (input?.status && input.status !== "ALL") {
        filters.push("i.status = ?");
        params.push(input.status);
    }

    if (input?.studentId) {
        filters.push("i.student_id = ?");
        params.push(input.studentId);
    }

    if (input?.courseId) {
        filters.push("i.course_id = ?");
        params.push(input.courseId);
    }

    if (input?.groupId) {
        filters.push("COALESCE(i.group_id, c.group_id) = ?");
        params.push(input.groupId);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    return query<IncidentRow>(
        `
        ${getIncidentBaseSelect()}
        ${whereClause}
        ORDER BY
            CASE WHEN i.status = 'OPEN' THEN 0 ELSE 1 END,
            COALESCE(i.last_status_changed_at, i.updated_at, i.created_at) DESC,
            i.id DESC
        `,
        params,
    ).map(mapIncidentRow);
}

export function listIncidentsForTeacher(
    teacherUserId: number,
    input?: {
        status?: IncidentStatusDto | "ALL";
        studentId?: number;
        courseId?: number;
        groupId?: number;
    },
): IncidentListItemDto[] {
    const filters: string[] = [
        `
        (
            i.created_by_user_id = ?
            OR i.course_id IN (
                SELECT id
                FROM courses
                WHERE teacher_user_id = ?
            )
        )
        `,
    ];
    const params: Array<string | number> = [teacherUserId, teacherUserId];

    if (input?.status && input.status !== "ALL") {
        filters.push("i.status = ?");
        params.push(input.status);
    }

    if (input?.studentId) {
        filters.push("i.student_id = ?");
        params.push(input.studentId);
    }

    if (input?.courseId) {
        filters.push("i.course_id = ?");
        params.push(input.courseId);
    }

    if (input?.groupId) {
        filters.push("COALESCE(i.group_id, c.group_id) = ?");
        params.push(input.groupId);
    }

    return query<IncidentRow>(
        `
        ${getIncidentBaseSelect()}
        WHERE ${filters.join(" AND ")}
        ORDER BY
            CASE WHEN i.status = 'OPEN' THEN 0 ELSE 1 END,
            COALESCE(i.last_status_changed_at, i.updated_at, i.created_at) DESC,
            i.id DESC
        `,
        params,
    ).map(mapIncidentRow);
}

export function listIncidentsForTutor(
    tutorUserId: number,
    input?: {
        status?: IncidentStatusDto | "ALL";
        studentId?: number;
        courseId?: number;
        groupId?: number;
    },
): IncidentListItemDto[] {
    const filters: string[] = [
        `
        (
            COALESCE(i.group_id, c.group_id) IN (
                SELECT group_id
                FROM group_tutors
                WHERE tutor_user_id = ?
            )
            OR EXISTS (
                SELECT 1
                FROM group_students gs
                INNER JOIN group_tutors gt
                    ON gt.group_id = gs.group_id
                WHERE gs.student_id = i.student_id
                  AND gt.tutor_user_id = ?
            )
        )
        `,
    ];
    const params: Array<string | number> = [tutorUserId, tutorUserId];

    if (input?.status && input.status !== "ALL") {
        filters.push("i.status = ?");
        params.push(input.status);
    }

    if (input?.studentId) {
        filters.push("i.student_id = ?");
        params.push(input.studentId);
    }

    if (input?.courseId) {
        filters.push("i.course_id = ?");
        params.push(input.courseId);
    }

    if (input?.groupId) {
        filters.push("COALESCE(i.group_id, c.group_id) = ?");
        params.push(input.groupId);
    }

    return query<IncidentRow>(
        `
        ${getIncidentBaseSelect()}
        WHERE ${filters.join(" AND ")}
        ORDER BY
            CASE WHEN i.status = 'OPEN' THEN 0 ELSE 1 END,
            COALESCE(i.last_status_changed_at, i.updated_at, i.created_at) DESC,
            i.id DESC
        `,
        params,
    ).map(mapIncidentRow);
}

export function listIncidentNotes(incidentId: number): IncidentNoteDto[] {
    return query<IncidentNoteRow>(
        `
        SELECT
            n.id,
            n.incident_id,
            n.author_user_id,
            u.first_name AS author_first_name,
            u.last_name AS author_last_name,
            n.note,
            n.created_at
        FROM incident_notes n
        INNER JOIN users u
            ON u.id = n.author_user_id
        WHERE n.incident_id = ?
        ORDER BY n.created_at ASC, n.id ASC
        `,
        [incidentId],
    ).map(mapIncidentNoteRow);
}

export function createIncidentNote(input: {
    incidentId: number;
    authorUserId: number;
    note: string;
}): number {
    return transaction(() => {
        const result = execute(
            `
            INSERT INTO incident_notes (
                incident_id,
                author_user_id,
                note
            )
            VALUES (?, ?, ?)
            `,
            [input.incidentId, input.authorUserId, input.note],
        );

        createIncidentEvent({
            incidentId: input.incidentId,
            eventType: "NOTE_ADDED",
            actorUserId: input.authorUserId,
            fromValue: null,
            toValue: null,
            note: input.note,
        });

        return Number(result.lastInsertRowid);
    });
}

export function listIncidentEvents(incidentId: number) {
    return query<IncidentEventRow>(
        `
        SELECT
            e.id,
            e.incident_id,
            e.event_type,
            e.actor_user_id,
            u.first_name AS actor_first_name,
            u.last_name AS actor_last_name,
            e.from_value,
            e.to_value,
            e.note,
            e.created_at
        FROM incident_events e
        INNER JOIN users u
            ON u.id = e.actor_user_id
        WHERE e.incident_id = ?
        ORDER BY e.created_at ASC, e.id ASC
        `,
        [incidentId],
    ).map(mapIncidentEventRow);
}

export function createIncidentEvent(input: {
    incidentId: number;
    eventType: IncidentEventTypeDto;
    actorUserId: number;
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
}): number {
    const result = execute(
        `
        INSERT INTO incident_events (
            incident_id,
            event_type,
            actor_user_id,
            from_value,
            to_value,
            note
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            input.incidentId,
            input.eventType,
            input.actorUserId,
            input.fromValue ?? null,
            input.toValue ?? null,
            input.note ?? null,
        ],
    );

    return Number(result.lastInsertRowid);
}

export function closeIncident(input: {
    incidentId: number;
    actorUserId: number;
    reason: string | null;
}): void {
    transaction(() => {
        execute(
            `
            UPDATE incidents
            SET
                status = 'CLOSED',
                closed_at = CURRENT_TIMESTAMP,
                closed_by_user_id = ?,
                updated_at = CURRENT_TIMESTAMP,
                last_status_changed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [input.actorUserId, input.incidentId],
        );

        createIncidentEvent({
            incidentId: input.incidentId,
            eventType: "INCIDENT_CLOSED",
            actorUserId: input.actorUserId,
            fromValue: "OPEN",
            toValue: "CLOSED",
            note: input.reason,
        });
    });
}

export function reopenIncident(input: {
    incidentId: number;
    actorUserId: number;
    reason: string | null;
}): void {
    transaction(() => {
        execute(
            `
            UPDATE incidents
            SET
                status = 'OPEN',
                closed_at = NULL,
                closed_by_user_id = NULL,
                reopened_at = CURRENT_TIMESTAMP,
                reopened_by_user_id = ?,
                updated_at = CURRENT_TIMESTAMP,
                last_status_changed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [input.actorUserId, input.incidentId],
        );

        createIncidentEvent({
            incidentId: input.incidentId,
            eventType: "INCIDENT_REOPENED",
            actorUserId: input.actorUserId,
            fromValue: "CLOSED",
            toValue: "OPEN",
            note: input.reason,
        });
    });
}

export function listDirectorRecipientUserIds(): number[] {
    return query<RecipientRow>(
        `
        SELECT DISTINCT
            u.id AS user_id
        FROM users u
        INNER JOIN user_roles ur
            ON ur.user_id = u.id
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE u.is_active = 1
          AND r.code = 'DIRECTOR'
        ORDER BY u.id ASC
        `,
    ).map((row) => row.user_id);
}

export function listTutorRecipientUserIdsByGroup(groupId: number | null): number[] {
    if (groupId === null) {
        return [];
    }

    return query<RecipientRow>(
        `
        SELECT DISTINCT
            u.id AS user_id
        FROM group_tutors gt
        INNER JOIN users u
            ON u.id = gt.tutor_user_id
        WHERE gt.group_id = ?
          AND u.is_active = 1
        ORDER BY u.id ASC
        `,
        [groupId],
    ).map((row) => row.user_id);
}

export function listTeacherRecipientUserIdsByCourse(courseId: number | null): number[] {
    if (courseId === null) {
        return [];
    }

    return query<RecipientRow>(
        `
        SELECT DISTINCT
            u.id AS user_id
        FROM courses c
        INNER JOIN users u
            ON u.id = c.teacher_user_id
        WHERE c.id = ?
          AND u.is_active = 1
        ORDER BY u.id ASC
        `,
        [courseId],
    ).map((row) => row.user_id);
}

export function actorHasRole(actorUserId: number, role: RoleCode): boolean {
    const row = queryOne<{ found: number }>(
        `
        SELECT 1 AS found
        FROM user_roles ur
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE ur.user_id = ?
          AND r.code = ?
        LIMIT 1
        `,
        [actorUserId, role],
    );

    return Boolean(row);
}