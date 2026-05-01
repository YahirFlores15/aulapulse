import { getCourseStudentIds, getLatestAttendanceDate, getStudentAverageScore, getStudentCourseFinalGrade, getStudentCoursesForTrafficLight, getStudentTrafficLightSnapshot, getSubjectRiskStatus, getWeeklyAttendanceAggregate, listStudentAttendanceRecordsForCourseAndDateRange, listStudentIncidentsForTrafficLight, studentBelongsToCourse, studentExists, upsertStudentTrafficLightSnapshot, upsertSubjectRiskStatus, type StudentTrafficLightSnapshotRecord, type SubjectRiskStatusRecord, } from "@/server/domains/risk/repo";
import { calculateStudentTrafficLight } from "@/server/domains/risk/traffic-light-rules";
import { notifyStudentRiskTurnedRed } from "@/server/domains/notifications/service";
import type { AttendanceRiskInput } from "@/server/domains/risk/types";
import type { TrafficLight } from "@/shared/enums/traffic-light";


export class RiskServiceError extends Error {
    public readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "RiskServiceError";
        this.status = status;
    }
}

export type CalculatedSubjectRiskResult = {
    courseId: number;
    studentId: number;
    riskStatus: TrafficLight;
    averageScore: number | null;
    equivalentAbsencesWeek: number;
    attendanceRisk: TrafficLight | null;
    gradeRisk: TrafficLight | null;
    isIncomplete: boolean;
};

function getStartOfWeek(date: Date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function getEndOfWeek(date: Date) {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    end.setHours(23, 59, 59, 999);
    return end;
}

function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseISODateAsLocalNoon(date: string): Date {
    return new Date(`${date}T12:00:00`);
}

function getCurrentBusinessWeekRange() {
    const today = new Date();
    const weekStart = getStartOfWeek(today);
    const weekEnd = getEndOfWeek(today);

    return {
        weekStartDate: toIsoDate(weekStart),
        weekEndDate: toIsoDate(weekEnd),
    };
}

function getGradeRisk(averageScore: number | null): TrafficLight | null {
    if (averageScore === null) {
        return null;
    }

    if (averageScore <= 79) {
        return "RED";
    }

    if (averageScore <= 85) {
        return "YELLOW";
    }

    return "GREEN";
}

function getAttendanceRisk(
    equivalentAbsencesWeek: number,
    hasAttendanceData: boolean,
): TrafficLight | null {
    if (!hasAttendanceData) {
        return null;
    }

    if (equivalentAbsencesWeek >= 2) {
        return "YELLOW";
    }

    return "GREEN";
}

function getWorstRisk(risks: Array<TrafficLight | null>): TrafficLight {
    if (risks.includes("RED")) {
        return "RED";
    }

    if (risks.includes("YELLOW")) {
        return "YELLOW";
    }

    return "GREEN";
}

function getIncompleteFlag(averageScore: number | null): boolean {
    return averageScore === null;
}

function hasThreeConsecutiveAbsences(
    records: Array<{ date: string; status: "PRESENT" | "ABSENT" | "LATE" }>,
): boolean {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    let consecutiveAbsences = 0;

    for (const record of sorted) {
        if (record.status === "ABSENT") {
            consecutiveAbsences += 1;

            if (consecutiveAbsences >= 3) {
                return true;
            }

            continue;
        }

        consecutiveAbsences = 0;
    }

    return false;
}

function buildAttendanceRiskInput(params: {
    courseId: number;
    subjectId: number | null;
    subjectCode: string | null;
    subjectName: string | null;
    records: Array<{ date: string; status: "PRESENT" | "ABSENT" | "LATE" }>;
}): AttendanceRiskInput {
    return {
        courseId: params.courseId,
        subjectId: params.subjectId,
        subjectCode: params.subjectCode,
        subjectName: params.subjectName,
        absentCountWeek: params.records.filter((record) => record.status === "ABSENT").length,
        lateCountWeek: params.records.filter((record) => record.status === "LATE").length,
        hasThreeConsecutiveAbsences: hasThreeConsecutiveAbsences(params.records),
    };
}

function shouldNotifyRiskTurnedRed(params: {
    previousColor: TrafficLight | null;
    nextColor: TrafficLight;
}) {
    return params.nextColor === "RED" && params.previousColor !== "RED";
}

export function calculateStudentCourseRisk(
    courseId: number,
    studentId: number,
): CalculatedSubjectRiskResult {
    const belongs = studentBelongsToCourse(courseId, studentId);

    if (!belongs) {
        throw new RiskServiceError("El alumno no pertenece al curso indicado.", 400);
    }

    const averageScore = getStudentAverageScore(courseId, studentId);
    const latestAttendanceDate = getLatestAttendanceDate(courseId, studentId);

    let equivalentAbsencesWeek = 0;
    let attendanceRisk: TrafficLight | null = null;

    if (latestAttendanceDate) {
        const referenceDate = parseISODateAsLocalNoon(latestAttendanceDate);
        const weekStart = toIsoDate(getStartOfWeek(referenceDate));
        const weekEnd = toIsoDate(getEndOfWeek(referenceDate));
        const attendance = getWeeklyAttendanceAggregate(courseId, studentId, weekStart, weekEnd);

        equivalentAbsencesWeek =
            attendance.absentCount + Math.floor(attendance.lateCount / 3);

        attendanceRisk = getAttendanceRisk(equivalentAbsencesWeek, true);
    }

    const gradeRisk = getGradeRisk(averageScore);
    const riskStatus = getWorstRisk([gradeRisk, attendanceRisk]);
    const isIncomplete = getIncompleteFlag(averageScore);

    return {
        courseId,
        studentId,
        riskStatus,
        averageScore,
        equivalentAbsencesWeek,
        attendanceRisk,
        gradeRisk,
        isIncomplete,
    };
}

export function recalculateStudentCourseRisk(
    courseId: number,
    studentId: number,
): SubjectRiskStatusRecord {
    const calculated = calculateStudentCourseRisk(courseId, studentId);

    return upsertSubjectRiskStatus({
        courseId: calculated.courseId,
        studentId: calculated.studentId,
        riskStatus: calculated.riskStatus,
        averageScore: calculated.averageScore,
        equivalentAbsencesWeek: calculated.equivalentAbsencesWeek,
        attendanceRisk: calculated.attendanceRisk,
        gradeRisk: calculated.gradeRisk,
        isIncomplete: calculated.isIncomplete,
    });
}

export function recalculateCourseRiskForStudents(
    courseId: number,
    studentIds?: number[],
): SubjectRiskStatusRecord[] {
    const targetStudentIds =
        studentIds && studentIds.length > 0 ? studentIds : getCourseStudentIds(courseId);

    const uniqueStudentIds = [...new Set(targetStudentIds)];

    const subjectResults = uniqueStudentIds.map((studentId) =>
        recalculateStudentCourseRisk(courseId, studentId),
    );

    recalculateStudentTrafficLightsForStudents(uniqueStudentIds);

    return subjectResults;
}

export function getPersistedStudentCourseRisk(
    courseId: number,
    studentId: number,
): SubjectRiskStatusRecord | null {
    return getSubjectRiskStatus(courseId, studentId);
}

export function calculateAndPersistStudentTrafficLight(
    studentId: number,
): StudentTrafficLightSnapshotRecord {
    if (!studentExists(studentId)) {
        throw new RiskServiceError("El alumno no existe.", 404);
    }

    const previousSnapshot = getStudentTrafficLightSnapshot(studentId);
    const courses = getStudentCoursesForTrafficLight(studentId);
    const { weekStartDate, weekEndDate } = getCurrentBusinessWeekRange();

    const grades = courses.map((course) => {
        const finalGrade = getStudentCourseFinalGrade(course.courseId, studentId);

        return {
            courseId: course.courseId,
            subjectId: course.subjectId,
            subjectCode: course.subjectCode,
            subjectName: course.subjectName,
            finalScore: finalGrade.finalScore,
            isComplete: finalGrade.isComplete,
        };
    });

    const attendance = courses.map((course) => {
        const records = listStudentAttendanceRecordsForCourseAndDateRange(
            course.courseId,
            studentId,
            weekStartDate,
            weekEndDate,
        );

        return buildAttendanceRiskInput({
            courseId: course.courseId,
            subjectId: course.subjectId,
            subjectCode: course.subjectCode,
            subjectName: course.subjectName,
            records: records.map((record) => ({
                date: record.date,
                status: record.status,
            })),
        });
    });

    const incidents = listStudentIncidentsForTrafficLight(studentId).map((incident) => ({
        incidentId: incident.incidentId,
        status: incident.status,
        typeCode: incident.typeCode,
        typeName: incident.typeName,
        createdAt: incident.createdAt,
    }));

    const calculated = calculateStudentTrafficLight({
        studentId,
        grades,
        attendance,
        incidents,
    });

    const snapshot = upsertStudentTrafficLightSnapshot({
        studentId: calculated.studentId,
        color: calculated.color,
        causes: calculated.causes,
        redCausesCount: calculated.redCausesCount,
        yellowCausesCount: calculated.yellowCausesCount,
    });

    if (
        shouldNotifyRiskTurnedRed({
            previousColor: previousSnapshot?.color ?? null,
            nextColor: snapshot.color,
        })
    ) {
        notifyStudentRiskTurnedRed({
            studentId: snapshot.studentId,
            redCausesCount: snapshot.redCausesCount,
            yellowCausesCount: snapshot.yellowCausesCount,
            causes: snapshot.causes,
        });
    }

    return snapshot;
}

export function recalculateStudentTrafficLightsForStudents(
    studentIds: number[],
): StudentTrafficLightSnapshotRecord[] {
    const uniqueStudentIds = [...new Set(studentIds)];

    return uniqueStudentIds.map((studentId) =>
        calculateAndPersistStudentTrafficLight(studentId),
    );
}

export function getPersistedStudentTrafficLight(
    studentId: number,
): StudentTrafficLightSnapshotRecord | null {
    return getStudentTrafficLightSnapshot(studentId);
}