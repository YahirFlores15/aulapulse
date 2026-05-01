import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { getPersistedStudentCourseRisk } from "@/server/domains/risk/service";
import { execute, query, queryOne } from "@/server/db/queries";
import type { CaseStatus } from "@/shared/enums/case-status";


type DbTutorGroupRow = {
    id: number;
    cycle_id: number;
    cycle_code: string;
    cycle_name: string;
    code: string;
    name: string;
    tutor_user_id: number;
    tutor_first_name: string;
    tutor_last_name: string;
};

type DbTutorGroupStudentRow = {
    student_id: number;
    control_number: string;
    first_name: string;
    last_name: string;
    second_last_name: string | null;
    group_id: number;
    group_code: string;
    cycle_id: number;
};

type DbTutorStudentSubjectRow = {
    student_id: number;
    course_id: number | null;
    subject_id: number | null;
    subject_code: string;
    subject_name: string;
    teacher_user_id: number | null;
    teacher_first_name: string | null;
    teacher_last_name: string | null;
};

type DbReferralReasonRow = {
    code: string;
    name: string;
    is_active: number;
};

type DbReferralCaseRow = {
    id: number;
    student_id: number;
    student_control_number: string;
    student_first_name: string;
    student_last_name: string;
    student_second_last_name: string | null;
    group_id: number;
    group_code: string;
    created_by_user_id: number;
    created_by_first_name: string;
    created_by_last_name: string;
    reason_code: string;
    reason_name: string;
    status: CaseStatus;
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
    created_at: string;
    updated_at: string;
    last_status_changed_at: string | null;
};

type DbReferralCaseNoteRow = {
    id: number;
    case_id: number;
    author_user_id: number;
    author_first_name: string;
    author_last_name: string;
    note: string;
    created_at: string;
};

type DbReferralCaseEventRow = {
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

function buildFullName(
    firstName: string | null,
    lastName: string | null,
    secondLastName?: string | null,
) {
    return [firstName, lastName, secondLastName].filter(Boolean).join(" ");
}

export function listTutorGroups(tutorUserId: number) {
    return query<DbTutorGroupRow>(
        `
        SELECT
          g.id,
          g.cycle_id,
          c.code AS cycle_code,
          c.name AS cycle_name,
          g.code,
          g.name,
          gt.tutor_user_id,
          u.first_name AS tutor_first_name,
          u.last_name AS tutor_last_name
        FROM group_tutors gt
        INNER JOIN groups g ON g.id = gt.group_id
        INNER JOIN cycles c ON c.id = g.cycle_id
        INNER JOIN users u ON u.id = gt.tutor_user_id
        WHERE gt.tutor_user_id = ?
        ORDER BY c.start_date DESC, g.code ASC
      `,
        [tutorUserId],
    ).map((row) => ({
        id: row.id,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        cycleName: row.cycle_name,
        code: row.code,
        name: row.name,
        tutorUserId: row.tutor_user_id,
        tutorName: buildFullName(row.tutor_first_name, row.tutor_last_name),
    }));
}

export function getTutorGroupById(groupId: number, tutorUserId: number) {
    const row = queryOne<DbTutorGroupRow>(
        `
        SELECT
          g.id,
          g.cycle_id,
          c.code AS cycle_code,
          c.name AS cycle_name,
          g.code,
          g.name,
          gt.tutor_user_id,
          u.first_name AS tutor_first_name,
          u.last_name AS tutor_last_name
        FROM group_tutors gt
        INNER JOIN groups g ON g.id = gt.group_id
        INNER JOIN cycles c ON c.id = g.cycle_id
        INNER JOIN users u ON u.id = gt.tutor_user_id
        WHERE g.id = ? AND gt.tutor_user_id = ?
        LIMIT 1
      `,
        [groupId, tutorUserId],
    );

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        cycleName: row.cycle_name,
        code: row.code,
        name: row.name,
        tutorUserId: row.tutor_user_id,
        tutorName: buildFullName(row.tutor_first_name, row.tutor_last_name),
    };
}

export function listGroupStudents(groupId: number) {
    return query<DbTutorGroupStudentRow>(
        `
        SELECT
          s.id AS student_id,
          s.control_number,
          s.first_name,
          s.last_name,
          s.second_last_name,
          g.id AS group_id,
          g.code AS group_code,
          g.cycle_id
        FROM group_students gs
        INNER JOIN students s ON s.id = gs.student_id
        INNER JOIN groups g ON g.id = gs.group_id
        WHERE gs.group_id = ?
        ORDER BY s.last_name ASC, s.second_last_name ASC, s.first_name ASC
      `,
        [groupId],
    ).map((row) => ({
        studentId: row.student_id,
        controlNumber: row.control_number,
        fullName: buildFullName(row.first_name, row.last_name, row.second_last_name),
        groupId: row.group_id,
        groupCode: row.group_code,
        cycleId: row.cycle_id,
    }));
}

export function listStudentSubjectsForGroup(groupId: number) {
    return query<DbTutorStudentSubjectRow>(
        `
        SELECT
          gs.student_id,
          c.id AS course_id,
          sub.id AS subject_id,
          sub.code AS subject_code,
          sub.name AS subject_name,
          t.id AS teacher_user_id,
          t.first_name AS teacher_first_name,
          t.last_name AS teacher_last_name
        FROM group_students gs
        INNER JOIN groups g ON g.id = gs.group_id
        LEFT JOIN courses c
          ON c.group_id = gs.group_id
         AND c.cycle_id = g.cycle_id
        LEFT JOIN subjects sub ON sub.id = c.subject_id
        LEFT JOIN users t ON t.id = c.teacher_user_id
        WHERE gs.group_id = ?
        ORDER BY gs.student_id ASC, sub.name ASC
      `,
        [groupId],
    )
        .filter((row) => row.course_id && row.subject_id && row.subject_code && row.subject_name)
        .map((row) => {
            const persistedRisk =
                row.course_id !== null
                    ? getPersistedStudentCourseRisk(row.course_id, row.student_id)
                    : null;

            return {
                studentId: row.student_id,
                courseId: row.course_id,
                subjectId: row.subject_id,
                subjectCode: row.subject_code,
                subjectName: row.subject_name,
                teacherUserId: row.teacher_user_id,
                teacherName:
                    row.teacher_first_name && row.teacher_last_name
                        ? buildFullName(row.teacher_first_name, row.teacher_last_name)
                        : null,
                riskStatus: persistedRisk?.riskStatus ?? null,
                isIncomplete: persistedRisk?.isIncomplete ?? true,
            };
        });
}

export function getStudentInTutorGroup(studentId: number, groupId: number) {
    return queryOne<{ student_id: number }>(
        `
        SELECT gs.student_id
        FROM group_students gs
        WHERE gs.student_id = ? AND gs.group_id = ?
        LIMIT 1
      `,
        [studentId, groupId],
    );
}

export function listReferralReasons() {
    return query<DbReferralReasonRow>(
        `
        SELECT code, name, is_active
        FROM referral_reason_catalog
        ORDER BY name ASC
      `,
    ).map((row) => ({
        code: row.code,
        name: row.name,
        isActive: row.is_active === 1,
    }));
}

export function getReferralReasonByCode(code: string) {
    const row = queryOne<DbReferralReasonRow>(
        `
        SELECT code, name, is_active
        FROM referral_reason_catalog
        WHERE code = ?
        LIMIT 1
      `,
        [code],
    );

    if (!row) {
        return null;
    }

    return {
        code: row.code,
        name: row.name,
        isActive: row.is_active === 1,
    };
}

export function createReferralCase(input: {
    studentId: number;
    groupId: number;
    createdByUserId: number;
    reasonCode: string;
    summary: string;
    targetArea: ReferralTargetArea;
    sharedWithSupport: boolean;
}) {
    const result = execute(
        `
        INSERT INTO referral_cases (
          student_id,
          group_id,
          created_by_user_id,
          reason_code,
          status,
          summary,
          target_area,
          shared_with_support,
          last_status_changed_at
        )
        VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?, CURRENT_TIMESTAMP)
      `,
        [
            input.studentId,
            input.groupId,
            input.createdByUserId,
            input.reasonCode,
            input.summary,
            input.targetArea,
            input.sharedWithSupport ? 1 : 0,
        ],
    );

    return Number(result.lastInsertRowid);
}

export function updateReferralCaseSummary(
    caseId: number,
    input: {
        summary: string;
    },
) {
    execute(
        `
        UPDATE referral_cases
        SET
          summary = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [input.summary, caseId],
    );
}

export function listReferralCasesByTutor(tutorUserId: number) {
    return query<DbReferralCaseRow>(
        `
        SELECT
          rc.id,
          rc.student_id,
          s.control_number AS student_control_number,
          s.first_name AS student_first_name,
          s.last_name AS student_last_name,
          s.second_last_name AS student_second_last_name,
          rc.group_id,
          g.code AS group_code,
          rc.created_by_user_id,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name,
          rc.reason_code,
          rr.name AS reason_name,
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
          rc.created_at,
          rc.updated_at,
          rc.last_status_changed_at
        FROM referral_cases rc
        INNER JOIN group_tutors gt ON gt.group_id = rc.group_id
        INNER JOIN students s ON s.id = rc.student_id
        INNER JOIN groups g ON g.id = rc.group_id
        INNER JOIN users u ON u.id = rc.created_by_user_id
        INNER JOIN referral_reason_catalog rr ON rr.code = rc.reason_code
        LEFT JOIN users closer ON closer.id = rc.closed_by_user_id
        LEFT JOIN users reopener ON reopener.id = rc.reopened_by_user_id
        WHERE gt.tutor_user_id = ?
        ORDER BY
          CASE WHEN rc.status = 'OPEN' THEN 0 ELSE 1 END,
          COALESCE(rc.last_status_changed_at, rc.updated_at, rc.created_at) DESC,
          rc.id DESC
      `,
        [tutorUserId],
    ).map((row) => ({
        id: row.id,
        studentId: row.student_id,
        studentControlNumber: row.student_control_number,
        studentName: buildFullName(
            row.student_first_name,
            row.student_last_name,
            row.student_second_last_name,
        ),
        groupId: row.group_id,
        groupCode: row.group_code,
        createdByUserId: row.created_by_user_id,
        createdByName: buildFullName(
            row.created_by_first_name,
            row.created_by_last_name,
        ),
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
                ? buildFullName(row.closed_by_first_name, row.closed_by_last_name)
                : null,
        reopenedAt: row.reopened_at,
        reopenedByUserId: row.reopened_by_user_id,
        reopenedByName:
            row.reopened_by_user_id !== null
                ? buildFullName(row.reopened_by_first_name, row.reopened_by_last_name)
                : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastStatusChangedAt:
            row.last_status_changed_at ?? row.closed_at ?? row.opened_at ?? row.updated_at,
    }));
}

export function getReferralCaseById(caseId: number, tutorUserId: number) {
    const row = queryOne<DbReferralCaseRow>(
        `
        SELECT
          rc.id,
          rc.student_id,
          s.control_number AS student_control_number,
          s.first_name AS student_first_name,
          s.last_name AS student_last_name,
          s.second_last_name AS student_second_last_name,
          rc.group_id,
          g.code AS group_code,
          rc.created_by_user_id,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name,
          rc.reason_code,
          rr.name AS reason_name,
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
          rc.created_at,
          rc.updated_at,
          rc.last_status_changed_at
        FROM referral_cases rc
        INNER JOIN group_tutors gt ON gt.group_id = rc.group_id
        INNER JOIN students s ON s.id = rc.student_id
        INNER JOIN groups g ON g.id = rc.group_id
        INNER JOIN users u ON u.id = rc.created_by_user_id
        INNER JOIN referral_reason_catalog rr ON rr.code = rc.reason_code
        LEFT JOIN users closer ON closer.id = rc.closed_by_user_id
        LEFT JOIN users reopener ON reopener.id = rc.reopened_by_user_id
        WHERE rc.id = ? AND gt.tutor_user_id = ?
        LIMIT 1
      `,
        [caseId, tutorUserId],
    );

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        studentId: row.student_id,
        studentControlNumber: row.student_control_number,
        studentName: buildFullName(
            row.student_first_name,
            row.student_last_name,
            row.student_second_last_name,
        ),
        groupId: row.group_id,
        groupCode: row.group_code,
        createdByUserId: row.created_by_user_id,
        createdByName: buildFullName(
            row.created_by_first_name,
            row.created_by_last_name,
        ),
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
                ? buildFullName(row.closed_by_first_name, row.closed_by_last_name)
                : null,
        reopenedAt: row.reopened_at,
        reopenedByUserId: row.reopened_by_user_id,
        reopenedByName:
            row.reopened_by_user_id !== null
                ? buildFullName(row.reopened_by_first_name, row.reopened_by_last_name)
                : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastStatusChangedAt:
            row.last_status_changed_at ?? row.closed_at ?? row.opened_at ?? row.updated_at,
    };
}

export function listReferralCaseNotes(caseId: number) {
    return query<DbReferralCaseNoteRow>(
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
        INNER JOIN users u ON u.id = n.author_user_id
        WHERE n.case_id = ?
        ORDER BY n.created_at ASC, n.id ASC
      `,
        [caseId],
    ).map((row) => ({
        id: row.id,
        caseId: row.case_id,
        authorUserId: row.author_user_id,
        authorName: buildFullName(
            row.author_first_name,
            row.author_last_name,
        ),
        note: row.note,
        createdAt: row.created_at,
    }));
}

export function createReferralCaseNote(input: {
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
        )
        VALUES (?, ?, ?)
      `,
        [input.caseId, input.authorUserId, input.note],
    );

    return Number(result.lastInsertRowid);
}

export function listReferralCaseEvents(caseId: number) {
    return query<DbReferralCaseEventRow>(
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
        INNER JOIN users u ON u.id = e.actor_user_id
        WHERE e.case_id = ?
        ORDER BY e.created_at ASC, e.id ASC
      `,
        [caseId],
    ).map((row) => ({
        id: row.id,
        caseId: row.case_id,
        eventType: row.event_type,
        actorUserId: row.actor_user_id,
        actorName: buildFullName(row.actor_first_name, row.actor_last_name),
        fromValue: row.from_value,
        toValue: row.to_value,
        note: row.note,
        createdAt: row.created_at,
    }));
}