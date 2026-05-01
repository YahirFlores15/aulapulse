import type { ReferralCaseEventDto, ReferralCaseWorkflowDetailDto, ReferralCaseWorkflowDto, } from "@/shared/dtos/referrals/referral-workflow.dto";
import type { ReferralAcademicContextDto, ReferralCreatedFromRoleDto, } from "@/shared/dtos/referrals/incident-referral.dto";
import type { DirectorReferralFiltersInput } from "@/shared/schemas/referrals/referral-workflow.schema";
import type { IncidentStatusDto } from "@/shared/dtos/incidents/incidents.dto";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { execute, query, queryOne } from "@/server/db/queries";


type ReferralCaseWorkflowRow = {
    id: number;
    student_id: number;
    student_control_number: string;
    student_first_name: string;
    student_last_name: string;
    student_second_last_name: string | null;
    group_id: number;
    group_code: string;
    group_name: string;
    created_by_user_id: number;
    created_by_first_name: string;
    created_by_last_name: string;
    reason_code: string;
    reason_name: string;
    status: "OPEN" | "CLOSED";
    summary: string;
    target_area: ReferralTargetArea;
    shared_with_support: number;
    opened_at: string;
    closed_at: string | null;
    closed_by_user_id: number | null;
    closed_by_first_name: string | null;
    closed_by_last_name: string | null;
    reopened_at: string | null;
    reopened_by_user_id: number | null;
    reopened_by_first_name: string | null;
    reopened_by_last_name: string | null;
    related_teacher_user_id: number | null;
    related_teacher_first_name: string | null;
    related_teacher_last_name: string | null;
    tutor_user_id: number | null;
    incident_id: number | null;
    incident_type_code: string | null;
    incident_type_name: string | null;
    incident_status: IncidentStatusDto | null;
    academic_context_json: string | null;
    created_from_role: ReferralCreatedFromRoleDto | null;
    created_at: string;
    updated_at: string;
    last_status_changed_at: string;
};

type ReferralCaseNoteRow = {
    id: number;
    case_id: number;
    author_user_id: number;
    author_first_name: string;
    author_last_name: string;
    note: string;
    created_at: string;
};

type ReferralCaseEventRow = {
    id: number;
    case_id: number;
    event_type: "CASE_CREATED" | "NOTE_ADDED" | "CASE_CLOSED" | "CASE_REOPENED" | "TARGET_CHANGED";
    actor_user_id: number;
    actor_first_name: string;
    actor_last_name: string;
    from_value: string | null;
    to_value: string | null;
    note: string | null;
    created_at: string;
};

function buildFullName(parts: Array<string | null | undefined>) {
    return parts
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
        .join(" ");
}

function parseAcademicContextJson(
    value: string | null,
): ReferralAcademicContextDto | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as ReferralAcademicContextDto;
    } catch {
        return null;
    }
}

function mapReferralCaseRow(row: ReferralCaseWorkflowRow): ReferralCaseWorkflowDto & { tutorUserId: number | null } {
    return {
        id: row.id,
        studentId: row.student_id,
        studentControlNumber: row.student_control_number,
        studentFullName: buildFullName([
            row.student_first_name,
            row.student_last_name,
            row.student_second_last_name,
        ]),
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
        createdByUserId: row.created_by_user_id,
        createdByName: buildFullName([row.created_by_first_name, row.created_by_last_name]),
        reasonCode: row.reason_code,
        reasonName: row.reason_name,
        status: row.status,
        summary: row.summary,
        targetArea: row.target_area,
        sharedWithSupport: row.shared_with_support === 1,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
        closedByUserId: row.closed_by_user_id,
        closedByName:
            row.closed_by_user_id !== null
                ? buildFullName([row.closed_by_first_name, row.closed_by_last_name])
                : null,
        reopenedAt: row.reopened_at,
        reopenedByUserId: row.reopened_by_user_id,
        reopenedByName:
            row.reopened_by_user_id !== null
                ? buildFullName([row.reopened_by_first_name, row.reopened_by_last_name])
                : null,
        relatedTeacherUserId: row.related_teacher_user_id,
        relatedTeacherName:
            row.related_teacher_user_id !== null
                ? buildFullName([row.related_teacher_first_name, row.related_teacher_last_name])
                : null,
        incidentId: row.incident_id,
        incidentTypeCode: row.incident_type_code,
        incidentTypeName: row.incident_type_name,
        incidentStatus: row.incident_status,
        academicContext: parseAcademicContextJson(row.academic_context_json),
        createdFromRole: row.created_from_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastStatusChangedAt: row.last_status_changed_at,
        tutorUserId: row.tutor_user_id,
    };
}

function mapReferralCaseNoteRow(row: ReferralCaseNoteRow) {
    return {
        id: row.id,
        caseId: row.case_id,
        authorUserId: row.author_user_id,
        authorName: buildFullName([row.author_first_name, row.author_last_name]),
        note: row.note,
        createdAt: row.created_at,
    };
}

function mapReferralCaseEventRow(row: ReferralCaseEventRow): ReferralCaseEventDto {
    return {
        id: row.id,
        caseId: row.case_id,
        eventType: row.event_type,
        actorUserId: row.actor_user_id,
        actorName: buildFullName([row.actor_first_name, row.actor_last_name]),
        fromValue: row.from_value,
        toValue: row.to_value,
        note: row.note,
        createdAt: row.created_at,
    };
}

const referralCaseSelect = `
    SELECT
        rc.id,
        rc.student_id,
        s.control_number AS student_control_number,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.second_last_name AS student_second_last_name,
        rc.group_id,
        g.code AS group_code,
        g.name AS group_name,
        rc.created_by_user_id,
        creator.first_name AS created_by_first_name,
        creator.last_name AS created_by_last_name,
        rc.reason_code,
        rrc.name AS reason_name,
        rc.status,
        rc.summary,
        rc.target_area,
        rc.shared_with_support,
        rc.opened_at,
        rc.closed_at,
        rc.closed_by_user_id,
        closer.first_name AS closed_by_first_name,
        closer.last_name AS closed_by_last_name,
        rc.reopened_at,
        rc.reopened_by_user_id,
        reopener.first_name AS reopened_by_first_name,
        reopener.last_name AS reopened_by_last_name,
        rc.related_teacher_user_id,
        teacher.first_name AS related_teacher_first_name,
        teacher.last_name AS related_teacher_last_name,
        gt.tutor_user_id,
        rc.incident_id,
        origin_incident.type_code AS incident_type_code,
        origin_incident_type.name AS incident_type_name,
        origin_incident.status AS incident_status,
        rc.academic_context_json,
        rc.created_from_role,
        rc.created_at,
        rc.updated_at,
        rc.last_status_changed_at
    FROM referral_cases rc
    INNER JOIN students s
        ON s.id = rc.student_id
    INNER JOIN groups g
        ON g.id = rc.group_id
    INNER JOIN referral_reason_catalog rrc
        ON rrc.code = rc.reason_code
    INNER JOIN users creator
        ON creator.id = rc.created_by_user_id
    LEFT JOIN users closer
        ON closer.id = rc.closed_by_user_id
    LEFT JOIN users reopener
        ON reopener.id = rc.reopened_by_user_id
    LEFT JOIN users teacher
        ON teacher.id = rc.related_teacher_user_id
    LEFT JOIN group_tutors gt
        ON gt.group_id = rc.group_id
    LEFT JOIN incidents origin_incident
        ON origin_incident.id = rc.incident_id
    LEFT JOIN incident_types origin_incident_type
        ON origin_incident_type.code = origin_incident.type_code
`;

export function listReferralCasesForDirector(filters: DirectorReferralFiltersInput) {
    const where: string[] = [];
    const params: Array<string | number> = [];

    if (filters.status) {
        where.push("rc.status = ?");
        params.push(filters.status);
    }

    if (filters.targetArea) {
        where.push("rc.target_area = ?");
        params.push(filters.targetArea);
    }

    if (filters.groupId) {
        where.push("rc.group_id = ?");
        params.push(filters.groupId);
    }

    if (filters.studentId) {
        where.push("rc.student_id = ?");
        params.push(filters.studentId);
    }

    if (filters.incidentId) {
        where.push("rc.incident_id = ?");
        params.push(filters.incidentId);
    }

    if (filters.createdByUserId) {
        where.push("rc.created_by_user_id = ?");
        params.push(filters.createdByUserId);
    }

    if (filters.relatedTeacherUserId) {
        where.push("rc.related_teacher_user_id = ?");
        params.push(filters.relatedTeacherUserId);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = query<ReferralCaseWorkflowRow>(
        `
        ${referralCaseSelect}
        ${whereSql}
        ORDER BY
            CASE WHEN rc.status = 'OPEN' THEN 0 ELSE 1 END,
            rc.last_status_changed_at DESC,
            rc.id DESC
        `,
        params,
    );

    return rows.map(mapReferralCaseRow);
}

export function getReferralCaseForWorkflow(caseId: number) {
    const row = queryOne<ReferralCaseWorkflowRow>(
        `
        ${referralCaseSelect}
        WHERE rc.id = ?
        LIMIT 1
        `,
        [caseId],
    );

    if (!row) {
        return null;
    }

    return mapReferralCaseRow(row);
}

export function listReferralCaseNotesForWorkflow(caseId: number) {
    const rows = query<ReferralCaseNoteRow>(
        `
        SELECT
            n.id,
            n.case_id,
            n.author_user_id,
            u.first_name AS author_first_name,
            u.last_name AS author_last_name,
            n.note,
            n.created_at
        FROM referral_case_notes n
        INNER JOIN users u
            ON u.id = n.author_user_id
        WHERE n.case_id = ?
        ORDER BY n.created_at ASC, n.id ASC
        `,
        [caseId],
    );

    return rows.map(mapReferralCaseNoteRow);
}

export function listReferralCaseEvents(caseId: number): ReferralCaseEventDto[] {
    const rows = query<ReferralCaseEventRow>(
        `
        SELECT
            e.id,
            e.case_id,
            e.event_type,
            e.actor_user_id,
            u.first_name AS actor_first_name,
            u.last_name AS actor_last_name,
            e.from_value,
            e.to_value,
            e.note,
            e.created_at
        FROM referral_case_events e
        INNER JOIN users u
            ON u.id = e.actor_user_id
        WHERE e.case_id = ?
        ORDER BY e.created_at ASC, e.id ASC
        `,
        [caseId],
    );

    return rows.map(mapReferralCaseEventRow);
}

export function createReferralCaseWorkflowNote(input: {
    caseId: number;
    authorUserId: number;
    note: string;
}) {
    const result = execute(
        `
        INSERT INTO referral_case_notes (
            case_id,
            author_user_id,
            note
        ) VALUES (?, ?, ?)
        `,
        [input.caseId, input.authorUserId, input.note],
    );

    return Number(result.lastInsertRowid);
}

export function createReferralCaseEvent(input: {
    caseId: number;
    eventType: "CASE_CREATED" | "NOTE_ADDED" | "CASE_CLOSED" | "CASE_REOPENED" | "TARGET_CHANGED";
    actorUserId: number;
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
}) {
    const result = execute(
        `
        INSERT INTO referral_case_events (
            case_id,
            event_type,
            actor_user_id,
            from_value,
            to_value,
            note
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            input.caseId,
            input.eventType,
            input.actorUserId,
            input.fromValue ?? null,
            input.toValue ?? null,
            input.note ?? null,
        ],
    );

    return Number(result.lastInsertRowid);
}

export function closeReferralCase(input: {
    caseId: number;
    actorUserId: number;
}) {
    execute(
        `
        UPDATE referral_cases
        SET
            status = 'CLOSED',
            closed_at = CURRENT_TIMESTAMP,
            closed_by_user_id = ?,
            reopened_at = NULL,
            reopened_by_user_id = NULL,
            last_status_changed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [input.actorUserId, input.caseId],
    );
}

export function reopenReferralCase(input: {
    caseId: number;
    actorUserId: number;
}) {
    execute(
        `
        UPDATE referral_cases
        SET
            status = 'OPEN',
            reopened_at = CURRENT_TIMESTAMP,
            reopened_by_user_id = ?,
            closed_at = NULL,
            closed_by_user_id = NULL,
            last_status_changed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [input.actorUserId, input.caseId],
    );
}

export function changeReferralCaseTarget(input: {
    caseId: number;
    targetArea: ReferralTargetArea;
}) {
    execute(
        `
        UPDATE referral_cases
        SET
            target_area = ?,
            shared_with_support = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [input.targetArea, input.caseId],
    );
}

export function getReferralCaseWorkflowDetail(caseId: number): ReferralCaseWorkflowDetailDto | null {
    const caseItem = getReferralCaseForWorkflow(caseId);

    if (!caseItem) {
        return null;
    }

    return {
        caseItem,
        notes: listReferralCaseNotesForWorkflow(caseId),
        events: listReferralCaseEvents(caseId),
    };
}