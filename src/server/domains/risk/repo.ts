import type { StudentTrafficLightCauseDto } from "@/shared/dtos/risk/student-traffic-light.dto";
import type { TrafficLight } from "@/shared/enums/traffic-light";
import { execute, query, queryOne } from "@/server/db/queries";


type CourseStudentRow = {
    student_id: number;
};

type GradeAggregateRow = {
    average_score: number | null;
};

type AttendanceWeekReferenceRow = {
    latest_date: string | null;
};

type AttendanceAggregateRow = {
    absent_count: number;
    late_count: number;
};

type SubjectRiskStatusRow = {
    id: number;
    course_id: number;
    student_id: number;
    risk_status: TrafficLight;
    average_score: number | null;
    equivalent_absences_week: number;
    attendance_risk: TrafficLight | null;
    grade_risk: TrafficLight | null;
    is_incomplete: number;
    calculated_at: string;
    updated_at: string;
};

type CourseGradeUnitForRiskRow = {
    id: number;
    weight_percentage: number;
};

type CourseGradeEntryForRiskRow = {
    grade_unit_id: number;
    score: number;
};

type StudentCourseForTrafficLightRow = {
    course_id: number;
    subject_id: number | null;
    subject_code: string | null;
    subject_name: string | null;
};

type AttendanceRecordForRiskRow = {
    student_id: number;
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE";
};

type IncidentForRiskRow = {
    id: number;
    status: "OPEN" | "CLOSED";
    type_code: string;
    type_name: string | null;
    created_at: string;
};

type StudentTrafficLightSnapshotRow = {
    id: number;
    student_id: number;
    color: TrafficLight;
    causes_json: string;
    red_causes_count: number;
    yellow_causes_count: number;
    calculated_at: string;
    created_at: string;
    updated_at: string;
};

export type PersistSubjectRiskStatusInput = {
    courseId: number;
    studentId: number;
    riskStatus: TrafficLight;
    averageScore: number | null;
    equivalentAbsencesWeek: number;
    attendanceRisk: TrafficLight | null;
    gradeRisk: TrafficLight | null;
    isIncomplete: boolean;
};

export type SubjectRiskStatusRecord = {
    id: number;
    courseId: number;
    studentId: number;
    riskStatus: TrafficLight;
    averageScore: number | null;
    equivalentAbsencesWeek: number;
    attendanceRisk: TrafficLight | null;
    gradeRisk: TrafficLight | null;
    isIncomplete: boolean;
    calculatedAt: string;
    updatedAt: string;
};

export type StudentCourseForTrafficLightRecord = {
    courseId: number;
    subjectId: number | null;
    subjectCode: string | null;
    subjectName: string | null;
};

export type StudentCourseFinalGradeRecord = {
    finalScore: number | null;
    isComplete: boolean;
};

export type AttendanceRecordForRisk = {
    studentId: number;
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE";
};

export type IncidentForRiskRecord = {
    incidentId: number;
    status: "OPEN" | "CLOSED";
    typeCode: string;
    typeName: string | null;
    createdAt: string;
};

export type PersistStudentTrafficLightSnapshotInput = {
    studentId: number;
    color: TrafficLight;
    causes: StudentTrafficLightCauseDto[];
    redCausesCount: number;
    yellowCausesCount: number;
};

export type StudentTrafficLightSnapshotRecord = {
    id: number;
    studentId: number;
    color: TrafficLight;
    causes: StudentTrafficLightCauseDto[];
    redCausesCount: number;
    yellowCausesCount: number;
    calculatedAt: string;
    createdAt: string;
    updatedAt: string;
};

function mapSubjectRiskStatusRow(row: SubjectRiskStatusRow): SubjectRiskStatusRecord {
    return {
        id: row.id,
        courseId: row.course_id,
        studentId: row.student_id,
        riskStatus: row.risk_status,
        averageScore: row.average_score,
        equivalentAbsencesWeek: row.equivalent_absences_week,
        attendanceRisk: row.attendance_risk,
        gradeRisk: row.grade_risk,
        isIncomplete: row.is_incomplete === 1,
        calculatedAt: row.calculated_at,
        updatedAt: row.updated_at,
    };
}

function safeParseCausesJson(value: string): StudentTrafficLightCauseDto[] {
    try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed as StudentTrafficLightCauseDto[];
    } catch {
        return [];
    }
}

function mapStudentTrafficLightSnapshotRow(
    row: StudentTrafficLightSnapshotRow,
): StudentTrafficLightSnapshotRecord {
    return {
        id: row.id,
        studentId: row.student_id,
        color: row.color,
        causes: safeParseCausesJson(row.causes_json),
        redCausesCount: row.red_causes_count,
        yellowCausesCount: row.yellow_causes_count,
        calculatedAt: row.calculated_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function normalizeToTwoDecimals(value: number): number {
    return Number(value.toFixed(2));
}

export function getCourseStudentIds(courseId: number): number[] {
    const rows = query<CourseStudentRow>(
        `
        SELECT DISTINCT gs.student_id
        FROM courses c
        INNER JOIN group_students gs
            ON gs.group_id = c.group_id
           AND gs.cycle_id = c.cycle_id
        WHERE c.id = ?
        ORDER BY gs.student_id ASC
        `,
        [courseId],
    );

    return rows.map((row) => row.student_id);
}

export function studentBelongsToCourse(courseId: number, studentId: number): boolean {
    const row = queryOne<{ exists_flag: number }>(
        `
        SELECT 1 AS exists_flag
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

export function getStudentCourseFinalGrade(
    courseId: number,
    studentId: number,
): StudentCourseFinalGradeRecord {
    const units = query<CourseGradeUnitForRiskRow>(
        `
        SELECT
            id,
            weight_percentage
        FROM course_grade_units
        WHERE course_id = ?
        ORDER BY sort_order ASC, id ASC
        `,
        [courseId],
    );

    if (units.length === 0) {
        return {
            finalScore: null,
            isComplete: false,
        };
    }

    const entries = query<CourseGradeEntryForRiskRow>(
        `
        SELECT
            grade_unit_id,
            score
        FROM course_grade_entries
        WHERE course_id = ?
          AND student_id = ?
        `,
        [courseId, studentId],
    );

    const entryByUnitId = new Map<number, CourseGradeEntryForRiskRow>();

    for (const entry of entries) {
        entryByUnitId.set(entry.grade_unit_id, entry);
    }

    let total = 0;

    for (const unit of units) {
        const entry = entryByUnitId.get(unit.id);

        if (!entry) {
            return {
                finalScore: null,
                isComplete: false,
            };
        }

        total += (entry.score * unit.weight_percentage) / 100;
    }

    return {
        finalScore: normalizeToTwoDecimals(total),
        isComplete: true,
    };
}

/**
 * Compatibilidad con el riesgo viejo por materia.
 * Antes esta función calculaba AVG desde la tabla legacy "grades".
 * Ahora devuelve la calificación final ponderada del modelo nuevo.
 */
export function getStudentAverageScore(courseId: number, studentId: number): number | null {
    const finalGrade = getStudentCourseFinalGrade(courseId, studentId);

    return finalGrade.finalScore;
}

export function getLatestAttendanceDate(courseId: number, studentId: number): string | null {
    const row =
        queryOne<AttendanceWeekReferenceRow>(
            `
            SELECT MAX(ar.date) AS latest_date
            FROM attendance_records ar
            WHERE ar.course_id = ?
              AND ar.student_id = ?
            `,
            [courseId, studentId],
        ) ?? null;

    return row?.latest_date ?? null;
}

export function getWeeklyAttendanceAggregate(
    courseId: number,
    studentId: number,
    weekStartDate: string,
    weekEndDate: string,
): { absentCount: number; lateCount: number } {
    const row =
        queryOne<AttendanceAggregateRow>(
            `
            SELECT
                SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,
                SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END) AS late_count
            FROM attendance_records ar
            WHERE ar.course_id = ?
              AND ar.student_id = ?
              AND ar.date >= ?
              AND ar.date <= ?
            `,
            [courseId, studentId, weekStartDate, weekEndDate],
        ) ?? null;

    return {
        absentCount: row?.absent_count ?? 0,
        lateCount: row?.late_count ?? 0,
    };
}

export function upsertSubjectRiskStatus(input: PersistSubjectRiskStatusInput): SubjectRiskStatusRecord {
    execute(
        `
        INSERT INTO subject_risk_status (
            course_id,
            student_id,
            risk_status,
            average_score,
            equivalent_absences_week,
            attendance_risk,
            grade_risk,
            is_incomplete,
            calculated_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(course_id, student_id) DO UPDATE SET
            risk_status = excluded.risk_status,
            average_score = excluded.average_score,
            equivalent_absences_week = excluded.equivalent_absences_week,
            attendance_risk = excluded.attendance_risk,
            grade_risk = excluded.grade_risk,
            is_incomplete = excluded.is_incomplete,
            calculated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
            input.courseId,
            input.studentId,
            input.riskStatus,
            input.averageScore,
            input.equivalentAbsencesWeek,
            input.attendanceRisk,
            input.gradeRisk,
            input.isIncomplete ? 1 : 0,
        ],
    );

    const row = queryOne<SubjectRiskStatusRow>(
        `
        SELECT
            id,
            course_id,
            student_id,
            risk_status,
            average_score,
            equivalent_absences_week,
            attendance_risk,
            grade_risk,
            is_incomplete,
            calculated_at,
            updated_at
        FROM subject_risk_status
        WHERE course_id = ?
          AND student_id = ?
        LIMIT 1
        `,
        [input.courseId, input.studentId],
    );

    if (!row) {
        throw new Error("No se pudo recuperar el semáforo recién calculado.");
    }

    return mapSubjectRiskStatusRow(row);
}

export function getSubjectRiskStatus(courseId: number, studentId: number): SubjectRiskStatusRecord | null {
    const row =
        queryOne<SubjectRiskStatusRow>(
            `
            SELECT
                id,
                course_id,
                student_id,
                risk_status,
                average_score,
                equivalent_absences_week,
                attendance_risk,
                grade_risk,
                is_incomplete,
                calculated_at,
                updated_at
            FROM subject_risk_status
            WHERE course_id = ?
              AND student_id = ?
            LIMIT 1
            `,
            [courseId, studentId],
        ) ?? null;

    return row ? mapSubjectRiskStatusRow(row) : null;
}

export function getStudentCoursesForTrafficLight(
    studentId: number,
): StudentCourseForTrafficLightRecord[] {
    return query<StudentCourseForTrafficLightRow>(
        `
        SELECT
            c.id AS course_id,
            s.id AS subject_id,
            s.code AS subject_code,
            s.name AS subject_name
        FROM group_students gs
        INNER JOIN courses c
            ON c.group_id = gs.group_id
           AND c.cycle_id = gs.cycle_id
        INNER JOIN subjects s
            ON s.id = c.subject_id
        WHERE gs.student_id = ?
        ORDER BY s.name ASC, c.id ASC
        `,
        [studentId],
    ).map((row) => ({
        courseId: row.course_id,
        subjectId: row.subject_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
    }));
}

export function listStudentAttendanceRecordsForCourseAndDateRange(
    courseId: number,
    studentId: number,
    startDate: string,
    endDate: string,
): AttendanceRecordForRisk[] {
    return query<AttendanceRecordForRiskRow>(
        `
        SELECT
            student_id,
            date,
            status
        FROM attendance_records
        WHERE course_id = ?
          AND student_id = ?
          AND date >= ?
          AND date <= ?
        ORDER BY date ASC
        `,
        [courseId, studentId, startDate, endDate],
    ).map((row) => ({
        studentId: row.student_id,
        date: row.date,
        status: row.status,
    }));
}

export function listStudentIncidentsForTrafficLight(
    studentId: number,
): IncidentForRiskRecord[] {
    return query<IncidentForRiskRow>(
        `
        SELECT
            i.id,
            i.status,
            i.type_code,
            it.name AS type_name,
            i.created_at
        FROM incidents i
        INNER JOIN incident_types it
            ON it.code = i.type_code
        WHERE i.student_id = ?
        ORDER BY i.created_at DESC, i.id DESC
        `,
        [studentId],
    ).map((row) => ({
        incidentId: row.id,
        status: row.status,
        typeCode: row.type_code,
        typeName: row.type_name,
        createdAt: row.created_at,
    }));
}

export function upsertStudentTrafficLightSnapshot(
    input: PersistStudentTrafficLightSnapshotInput,
): StudentTrafficLightSnapshotRecord {
    const causesJson = JSON.stringify(input.causes);

    execute(
        `
        INSERT INTO student_traffic_light_snapshots (
            student_id,
            color,
            causes_json,
            red_causes_count,
            yellow_causes_count,
            calculated_at,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id) DO UPDATE SET
            color = excluded.color,
            causes_json = excluded.causes_json,
            red_causes_count = excluded.red_causes_count,
            yellow_causes_count = excluded.yellow_causes_count,
            calculated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
            input.studentId,
            input.color,
            causesJson,
            input.redCausesCount,
            input.yellowCausesCount,
        ],
    );

    const snapshot = getStudentTrafficLightSnapshot(input.studentId);

    if (!snapshot) {
        throw new Error("No se pudo recuperar el semáforo general recién calculado.");
    }

    return snapshot;
}

export function getStudentTrafficLightSnapshot(
    studentId: number,
): StudentTrafficLightSnapshotRecord | null {
    const row =
        queryOne<StudentTrafficLightSnapshotRow>(
            `
            SELECT
                id,
                student_id,
                color,
                causes_json,
                red_causes_count,
                yellow_causes_count,
                calculated_at,
                created_at,
                updated_at
            FROM student_traffic_light_snapshots
            WHERE student_id = ?
            LIMIT 1
            `,
            [studentId],
        ) ?? null;

    return row ? mapStudentTrafficLightSnapshotRow(row) : null;
}

export function studentExists(studentId: number): boolean {
    const row = queryOne<{ id: number }>(
        `
        SELECT id
        FROM students
        WHERE id = ?
        LIMIT 1
        `,
        [studentId],
    );

    return Boolean(row);
}