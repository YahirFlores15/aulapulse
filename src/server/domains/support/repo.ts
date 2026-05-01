import type { SupportStudentExpedientDto, SupportStudentIncidentDto, SupportStudentSubjectDto, } from "@/shared/dtos/support/support.dto";
import { getPersistedStudentCourseRisk } from "@/server/domains/risk/service";
import { query, queryOne } from "@/server/db/queries";


type StudentExpedientRow = {
    student_id: number;
    control_number: string;
    first_name: string;
    last_name: string;
    second_last_name: string | null;
    email: string | null;
    group_id: number;
    group_code: string;
    group_name: string;
    cycle_id: number;
    cycle_code: string;
    cycle_name: string;
};

type StudentSubjectRow = {
    student_id: number;
    course_id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    teacher_user_id: number;
    teacher_first_name: string;
    teacher_last_name: string;
};

type StudentIncidentRow = {
    incident_id: number;
    type_code: string;
    type_name: string;
    note: string;
    created_at: string;
    created_by_user_id: number;
    created_by_first_name: string;
    created_by_last_name: string;
};

function buildFullName(parts: Array<string | null | undefined>) {
    return parts
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
        .join(" ");
}

function mapStudentExpedientRow(
    row: StudentExpedientRow,
): Omit<SupportStudentExpedientDto, "fullName" | "subjects" | "incidents"> {
    return {
        studentId: row.student_id,
        controlNumber: row.control_number,
        firstName: row.first_name,
        lastName: row.last_name,
        secondLastName: row.second_last_name,
        email: row.email,
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        cycleName: row.cycle_name,
    };
}

function mapStudentSubjectRow(row: StudentSubjectRow): SupportStudentSubjectDto {
    const persistedRisk = getPersistedStudentCourseRisk(row.course_id, row.student_id);

    return {
        courseId: row.course_id,
        subjectId: row.subject_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        teacherUserId: row.teacher_user_id,
        teacherName: buildFullName([row.teacher_first_name, row.teacher_last_name]),
        riskStatus: persistedRisk?.riskStatus ?? null,
        isIncomplete: persistedRisk?.isIncomplete ?? true,
    };
}

function mapStudentIncidentRow(row: StudentIncidentRow): SupportStudentIncidentDto {
    return {
        incidentId: row.incident_id,
        typeCode: row.type_code,
        typeName: row.type_name,
        note: row.note,
        createdAt: row.created_at,
        createdByUserId: row.created_by_user_id,
        createdByName: buildFullName([row.created_by_first_name, row.created_by_last_name]),
    };
}

export function getStudentBasicExpedientByCaseId(
    caseId: number,
): SupportStudentExpedientDto | null {
    const row =
        queryOne<StudentExpedientRow>(
            `
            SELECT
                s.id AS student_id,
                s.control_number,
                s.first_name,
                s.last_name,
                s.second_last_name,
                s.email,
                g.id AS group_id,
                g.code AS group_code,
                g.name AS group_name,
                c.id AS cycle_id,
                c.code AS cycle_code,
                c.name AS cycle_name
            FROM referral_cases rc
            INNER JOIN students s
                ON s.id = rc.student_id
            INNER JOIN groups g
                ON g.id = rc.group_id
            INNER JOIN cycles c
                ON c.id = g.cycle_id
            WHERE rc.id = ?
            LIMIT 1
            `,
            [caseId],
        ) ?? null;

    if (!row) {
        return null;
    }

    const base = mapStudentExpedientRow(row);

    return {
        ...base,
        fullName: buildFullName([base.firstName, base.lastName, base.secondLastName]),
        subjects: [],
        incidents: [],
    };
}

export function listStudentSubjectsForCase(caseId: number): SupportStudentSubjectDto[] {
    const rows = query<StudentSubjectRow>(
        `
        SELECT
            rc.student_id,
            c.id AS course_id,
            sub.id AS subject_id,
            sub.code AS subject_code,
            sub.name AS subject_name,
            u.id AS teacher_user_id,
            u.first_name AS teacher_first_name,
            u.last_name AS teacher_last_name
        FROM referral_cases rc
        INNER JOIN courses c
            ON c.group_id = rc.group_id
        INNER JOIN subjects sub
            ON sub.id = c.subject_id
        INNER JOIN users u
            ON u.id = c.teacher_user_id
        WHERE rc.id = ?
        ORDER BY sub.name ASC, c.id ASC
        `,
        [caseId],
    );

    return rows.map(mapStudentSubjectRow);
}

export function listStudentIncidentsForCase(caseId: number): SupportStudentIncidentDto[] {
    const rows = query<StudentIncidentRow>(
        `
        SELECT
            i.id AS incident_id,
            i.type_code,
            it.name AS type_name,
            i.note,
            i.created_at,
            i.created_by_user_id,
            u.first_name AS created_by_first_name,
            u.last_name AS created_by_last_name
        FROM referral_cases rc
        INNER JOIN incidents i
            ON i.student_id = rc.student_id
        INNER JOIN incident_types it
            ON it.code = i.type_code
        INNER JOIN users u
            ON u.id = i.created_by_user_id
        WHERE rc.id = ?
        ORDER BY i.created_at DESC, i.id DESC
        `,
        [caseId],
    );

    return rows.map(mapStudentIncidentRow);
}