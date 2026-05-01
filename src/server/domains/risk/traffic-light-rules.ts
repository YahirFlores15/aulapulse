import type { AttendanceRiskInput, BuildCauseInput, CalculatedStudentTrafficLight, GradeRiskInput, IncidentRiskInput, StudentTrafficLightCalculationInput, } from "@/server/domains/risk/types";
import type { StudentTrafficLightCauseDto } from "@/shared/dtos/risk/student-traffic-light.dto";
import type { TrafficLight } from "@/shared/enums/traffic-light";


function buildCause(input: BuildCauseInput): StudentTrafficLightCauseDto {
    return {
        type: input.type,
        severity: input.severity,
        message: input.message,
        ...(input.courseId !== undefined ? { courseId: input.courseId } : {}),
        ...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
        ...(input.subjectCode !== undefined ? { subjectCode: input.subjectCode } : {}),
        ...(input.subjectName !== undefined ? { subjectName: input.subjectName } : {}),
        ...(input.incidentId !== undefined ? { incidentId: input.incidentId } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    };
}

function getFinalColor(causes: StudentTrafficLightCauseDto[]): TrafficLight {
    const hasRedCause = causes.some((cause) => cause.severity === "RED");

    if (hasRedCause) {
        return "RED";
    }

    const hasYellowCause = causes.some((cause) => cause.severity === "YELLOW");

    if (hasYellowCause) {
        return "YELLOW";
    }

    return "GREEN";
}

function buildGradeCause(input: GradeRiskInput): StudentTrafficLightCauseDto | null {
    if (!input.isComplete || input.finalScore === null) {
        return null;
    }

    if (input.finalScore <= 79) {
        return buildCause({
            type: "GRADE",
            severity: "RED",
            message: "Calificación final en riesgo crítico.",
            courseId: input.courseId,
            subjectId: input.subjectId,
            subjectCode: input.subjectCode,
            subjectName: input.subjectName,
            value: input.finalScore,
            metadata: {
                rule: "FINAL_SCORE_LESS_OR_EQUAL_79",
            },
        });
    }

    if (input.finalScore >= 80 && input.finalScore <= 85) {
        return buildCause({
            type: "GRADE",
            severity: "YELLOW",
            message: "Calificación final en zona de atención.",
            courseId: input.courseId,
            subjectId: input.subjectId,
            subjectCode: input.subjectCode,
            subjectName: input.subjectName,
            value: input.finalScore,
            metadata: {
                rule: "FINAL_SCORE_BETWEEN_80_AND_85",
            },
        });
    }

    return null;
}

function buildAttendanceCauses(
    input: AttendanceRiskInput,
): StudentTrafficLightCauseDto[] {
    const causes: StudentTrafficLightCauseDto[] = [];

    if (input.hasThreeConsecutiveAbsences) {
        causes.push(
            buildCause({
                type: "ATTENDANCE",
                severity: "RED",
                message: "Tiene 3 faltas seguidas en una materia.",
                courseId: input.courseId,
                subjectId: input.subjectId,
                subjectCode: input.subjectCode,
                subjectName: input.subjectName,
                value: 3,
                metadata: {
                    rule: "THREE_CONSECUTIVE_ABSENCES",
                },
            }),
        );
    }

    if (input.absentCountWeek >= 2) {
        causes.push(
            buildCause({
                type: "ATTENDANCE",
                severity: "YELLOW",
                message: "Tiene 2 o más faltas en la semana.",
                courseId: input.courseId,
                subjectId: input.subjectId,
                subjectCode: input.subjectCode,
                subjectName: input.subjectName,
                value: input.absentCountWeek,
                metadata: {
                    rule: "TWO_OR_MORE_WEEKLY_ABSENCES",
                },
            }),
        );
    }

    if (input.lateCountWeek >= 5) {
        causes.push(
            buildCause({
                type: "ATTENDANCE",
                severity: "YELLOW",
                message: "Tiene 5 o más retardos en la semana.",
                courseId: input.courseId,
                subjectId: input.subjectId,
                subjectCode: input.subjectCode,
                subjectName: input.subjectName,
                value: input.lateCountWeek,
                metadata: {
                    rule: "FIVE_OR_MORE_WEEKLY_LATES",
                },
            }),
        );
    }

    return causes;
}

function buildIncidentCause(
    input: IncidentRiskInput,
): StudentTrafficLightCauseDto {
    if (input.status === "OPEN") {
        return buildCause({
            type: "INCIDENT",
            severity: "RED",
            message: "Tiene una incidencia abierta.",
            incidentId: input.incidentId,
            value: input.typeName ?? input.typeCode,
            metadata: {
                rule: "OPEN_INCIDENT",
                typeCode: input.typeCode,
                createdAt: input.createdAt,
            },
        });
    }

    return buildCause({
        type: "INCIDENT",
        severity: "YELLOW",
        message: "Tiene una incidencia cerrada registrada.",
        incidentId: input.incidentId,
        value: input.typeName ?? input.typeCode,
        metadata: {
            rule: "CLOSED_INCIDENT",
            typeCode: input.typeCode,
            createdAt: input.createdAt,
        },
    });
}

export function calculateStudentTrafficLight(
    input: StudentTrafficLightCalculationInput,
): CalculatedStudentTrafficLight {
    const causes: StudentTrafficLightCauseDto[] = [];

    for (const grade of input.grades) {
        const cause = buildGradeCause(grade);

        if (cause) {
            causes.push(cause);
        }
    }

    for (const attendance of input.attendance) {
        causes.push(...buildAttendanceCauses(attendance));
    }

    for (const incident of input.incidents) {
        causes.push(buildIncidentCause(incident));
    }

    const redCausesCount = causes.filter((cause) => cause.severity === "RED").length;
    const yellowCausesCount = causes.filter(
        (cause) => cause.severity === "YELLOW",
    ).length;

    return {
        studentId: input.studentId,
        color: getFinalColor(causes),
        causes,
        redCausesCount,
        yellowCausesCount,
    };
}