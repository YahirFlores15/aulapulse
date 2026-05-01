import { courseHasStudent, deleteCourseAttendanceNonApplicableDay, getCourseAttendanceNonApplicableDay, getCourseGradeUnitById, getTeacherCourseById, listAttendanceByCourseAndDate, listAttendanceByCourseAndDateRange, listCourseGradeEntries, listCourseGradeUnits, listCourseStudents, listTeacherCourses, markCourseAttendanceNonApplicableDay, replaceCourseGradeUnits, upsertAttendanceBatch, upsertCourseGradeEntries, } from "@/server/domains/teacher/repo";
import { buildWeeklyAttendanceSummary, getBusinessWeekRange, getSpanishDayLabel, getTodayLocalISODate, isBusinessDay, } from "@/server/domains/teacher/attendance-calculation";
import type { AttendanceBatchUpsertInput, AttendanceQueryInput, MarkTodayNonApplicableInput, } from "@/shared/schemas/teacher/attendance.schema";
import type { TeacherCourseListItemDto, TeacherCourseStudentDto, TeacherCourseStudentsResponseDto, } from "@/shared/dtos/teacher/courses.dto";
import { buildStudentGradeSummary, validateGradeUnitsWeightSum, } from "@/server/domains/teacher/grade-calculation";
import { getPersistedStudentCourseRisk, recalculateCourseRiskForStudents, } from "@/server/domains/risk/service";
import type { AttendanceListResponseDto, AttendanceRecordDto, } from "@/shared/dtos/teacher/capture.dto";
import type { CourseAttendanceNonApplicableDayDto, } from "@/shared/dtos/teacher/attendance.dto";
import type { CourseGradesByUnitResponseDto } from "@/shared/dtos/teacher/grade-capture.dto";
import type { SaveGradeEntriesInput } from "@/shared/schemas/teacher/grade-capture.schema";
import type { ReplaceGradeUnitsInput } from "@/shared/schemas/teacher/grade-units.schema";
import type { GradeUnitsResponseDto } from "@/shared/dtos/teacher/grade-units.dto";


export class TeacherServiceError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "TeacherServiceError";
        this.status = status;
    }
}

function buildFullName(input: {
    firstName: string;
    lastName: string;
    secondLastName: string | null;
}): string {
    return [input.firstName, input.lastName, input.secondLastName]
        .filter(Boolean)
        .join(" ");
}

function mapCourseRowToDto(row: {
    id: number;
    cycle_id: number;
    cycle_code: string;
    cycle_name: string;
    group_id: number;
    group_code: string;
    group_name: string;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    teacher_user_id: number;
}): TeacherCourseListItemDto {
    return {
        id: row.id,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        cycleName: row.cycle_name,
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
        subjectId: row.subject_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        teacherUserId: row.teacher_user_id,
    };
}

function mapAttendanceRowToDto(row: {
    id: number;
    course_id: number;
    student_id: number;
    date: string;
    status: string;
    created_at: string;
    updated_at: string;
}): AttendanceRecordDto {
    return {
        id: row.id,
        courseId: row.course_id,
        studentId: row.student_id,
        date: row.date,
        status: row.status as AttendanceRecordDto["status"],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapNonApplicableDayRowToDto(row: {
    id: number;
    course_id: number;
    date: string;
    reason: string | null;
    created_by_user_id: number;
    created_at: string;
    updated_at: string;
}): CourseAttendanceNonApplicableDayDto {
    return {
        id: row.id,
        courseId: row.course_id,
        date: row.date,
        reason: row.reason,
        createdByUserId: row.created_by_user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapCourseGradeUnitRowToDto(row: {
    id: number;
    course_id: number;
    name: string;
    sort_order: number;
    weight_percentage: number;
    created_at: string;
    updated_at: string;
}) {
    return {
        id: row.id,
        courseId: row.course_id,
        name: row.name,
        sortOrder: row.sort_order,
        weightPercentage: row.weight_percentage,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapCourseGradeEntryRowToDto(row: {
    id: number;
    course_id: number;
    student_id: number;
    grade_unit_id: number;
    score: number;
    created_at: string;
    updated_at: string;
}) {
    return {
        id: row.id,
        courseId: row.course_id,
        studentId: row.student_id,
        gradeUnitId: row.grade_unit_id,
        score: row.score,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function ensureCourseExists(courseId: number) {
    const course = getTeacherCourseById(courseId);

    if (!course) {
        throw new TeacherServiceError("El curso no existe.", 404);
    }

    return course;
}

function ensureTeacherOwnsCourse(courseId: number, teacherUserId: number) {
    const course = ensureCourseExists(courseId);

    if (course.teacher_user_id !== teacherUserId) {
        throw new TeacherServiceError(
            "No tienes permisos para acceder a este curso.",
            403,
        );
    }

    return course;
}

function ensureStudentBelongsToCourse(courseId: number, studentId: number): void {
    const belongs = courseHasStudent(courseId, studentId);

    if (!belongs) {
        throw new TeacherServiceError(
            "El alumno no pertenece al grupo de este curso.",
            400,
        );
    }
}

function ensureTodayIsBusinessDay(today: string): void {
    if (!isBusinessDay(today)) {
        throw new TeacherServiceError(
            "La asistencia solo puede capturarse de lunes a viernes.",
            400,
        );
    }
}

function recalculateRiskForRecords(courseId: number, studentIds: number[]) {
    const uniqueStudentIds = [...new Set(studentIds)];

    if (uniqueStudentIds.length === 0) {
        return;
    }

    recalculateCourseRiskForStudents(courseId, uniqueStudentIds);
}

function buildCourseGradesResponse(
    courseId: number,
    selectedUnitId = 0,
): CourseGradesByUnitResponseDto {
    const units = listCourseGradeUnits(courseId).map(mapCourseGradeUnitRowToDto);
    const allEntries = listCourseGradeEntries(courseId).map(mapCourseGradeEntryRowToDto);
    const studentIds = listCourseStudents(courseId).map((student) => student.student_id);

    const summary = buildStudentGradeSummary({
        studentIds,
        units: units.map((unit) => ({
            id: unit.id,
            weightPercentage: unit.weightPercentage,
        })),
        entries: allEntries.map((entry) => ({
            studentId: entry.studentId,
            gradeUnitId: entry.gradeUnitId,
            score: entry.score,
        })),
    });

    return {
        courseId,
        unitId: selectedUnitId,
        units,
        entries: allEntries,
        summary,
    };
}

function buildAttendanceTodayResponse(courseId: number): AttendanceListResponseDto {
    const today = getTodayLocalISODate();
    const businessDay = isBusinessDay(today);
    const nonApplicableDay = getCourseAttendanceNonApplicableDay(courseId, today);
    const records = listAttendanceByCourseAndDate(courseId, today).map(
        mapAttendanceRowToDto,
    );

    const students = listCourseStudents(courseId);
    const { weekStartDate, weekEndDate } = getBusinessWeekRange(today);
    const weeklyRecords = listAttendanceByCourseAndDateRange(
        courseId,
        weekStartDate,
        weekEndDate,
    );

    const weeklySummary = buildWeeklyAttendanceSummary({
        studentIds: students.map((student) => student.student_id),
        records: weeklyRecords.map((record) => ({
            studentId: record.student_id,
            date: record.date,
            status: record.status as AttendanceRecordDto["status"],
        })),
    });

    return {
        courseId,
        date: today,
        dayLabel: getSpanishDayLabel(today),
        isBusinessDay: businessDay,
        nonApplicableDay: nonApplicableDay
            ? mapNonApplicableDayRowToDto(nonApplicableDay)
            : null,
        records,
        weeklySummary,
    };
}

export class TeacherService {
    listCourses(teacherUserId: number): TeacherCourseListItemDto[] {
        return listTeacherCourses(teacherUserId).map(mapCourseRowToDto);
    }

    getCourseStudents(
        teacherUserId: number,
        courseId: number,
    ): TeacherCourseStudentsResponseDto {
        const course = ensureTeacherOwnsCourse(courseId, teacherUserId);

        const students: TeacherCourseStudentDto[] = listCourseStudents(courseId).map(
            (student) => {
                const persistedRisk = getPersistedStudentCourseRisk(
                    courseId,
                    student.student_id,
                );

                return {
                    studentId: student.student_id,
                    controlNumber: student.control_number,
                    firstName: student.first_name,
                    lastName: student.last_name,
                    secondLastName: student.second_last_name,
                    fullName: buildFullName({
                        firstName: student.first_name,
                        lastName: student.last_name,
                        secondLastName: student.second_last_name,
                    }),
                    riskStatus: persistedRisk?.riskStatus ?? null,
                    isIncomplete: persistedRisk?.isIncomplete ?? true,
                };
            },
        );

        return {
            course: mapCourseRowToDto(course),
            students,
        };
    }

    getAttendance(
        teacherUserId: number,
        courseId: number,
        _query: AttendanceQueryInput,
    ): AttendanceListResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        return buildAttendanceTodayResponse(courseId);
    }

    saveAttendance(
        teacherUserId: number,
        courseId: number,
        input: AttendanceBatchUpsertInput,
    ): AttendanceListResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        const today = getTodayLocalISODate();
        ensureTodayIsBusinessDay(today);

        const nonApplicableDay = getCourseAttendanceNonApplicableDay(courseId, today);

        if (nonApplicableDay) {
            throw new TeacherServiceError(
                "Este día está marcado como no aplica para el curso. Quita esa marca antes de capturar asistencia.",
                400,
            );
        }

        const uniqueStudentIds = new Set<number>();

        for (const record of input.records) {
            if (uniqueStudentIds.has(record.studentId)) {
                throw new TeacherServiceError(
                    "No puedes enviar alumnos duplicados en la misma captura de asistencia.",
                    400,
                );
            }

            uniqueStudentIds.add(record.studentId);
            ensureStudentBelongsToCourse(courseId, record.studentId);
        }

        upsertAttendanceBatch(courseId, today, input.records);

        recalculateRiskForRecords(courseId, [...uniqueStudentIds]);

        return buildAttendanceTodayResponse(courseId);
    }

    markTodayAttendanceAsNonApplicable(
        teacherUserId: number,
        courseId: number,
        input: MarkTodayNonApplicableInput,
    ): AttendanceListResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        const today = getTodayLocalISODate();
        ensureTodayIsBusinessDay(today);

        const studentIds = listCourseStudents(courseId).map(
            (student) => student.student_id,
        );

        markCourseAttendanceNonApplicableDay({
            courseId,
            date: today,
            reason: input.reason ?? null,
            createdByUserId: teacherUserId,
        });

        recalculateRiskForRecords(courseId, studentIds);

        return buildAttendanceTodayResponse(courseId);
    }

    unmarkTodayAttendanceAsNonApplicable(
        teacherUserId: number,
        courseId: number,
    ): AttendanceListResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        const today = getTodayLocalISODate();
        ensureTodayIsBusinessDay(today);

        deleteCourseAttendanceNonApplicableDay(courseId, today);

        return buildAttendanceTodayResponse(courseId);
    }

    getGradeUnits(
        teacherUserId: number,
        courseId: number,
    ): GradeUnitsResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        const units = listCourseGradeUnits(courseId).map(mapCourseGradeUnitRowToDto);

        return {
            courseId,
            units,
        };
    }

    saveGradeUnits(
        teacherUserId: number,
        courseId: number,
        input: ReplaceGradeUnitsInput,
    ): GradeUnitsResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        const existingUnits = listCourseGradeUnits(courseId);

        if (existingUnits.length > 0) {
            throw new TeacherServiceError(
                "La configuración de unidades ya fue guardada y quedó bloqueada. Ya no se puede modificar.",
                400,
            );
        }

        if (!validateGradeUnitsWeightSum(input.units)) {
            throw new TeacherServiceError(
                "La suma de porcentajes debe ser exactamente 100.",
                400,
            );
        }

        replaceCourseGradeUnits(courseId, input.units);

        const units = listCourseGradeUnits(courseId).map(mapCourseGradeUnitRowToDto);
        const studentIds = listCourseStudents(courseId).map((student) => student.student_id);

        if (studentIds.length > 0) {
            recalculateRiskForRecords(courseId, studentIds);
        }

        return {
            courseId,
            units,
        };
    }

    getGrades(
        teacherUserId: number,
        courseId: number,
    ): CourseGradesByUnitResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        return buildCourseGradesResponse(courseId, 0);
    }

    saveGrades(
        teacherUserId: number,
        courseId: number,
        input: SaveGradeEntriesInput,
    ): CourseGradesByUnitResponseDto {
        ensureTeacherOwnsCourse(courseId, teacherUserId);

        const units = listCourseGradeUnits(courseId);

        if (units.length === 0) {
            throw new TeacherServiceError(
                "Primero debes configurar las unidades de evaluación del curso.",
                400,
            );
        }

        const unit = getCourseGradeUnitById(input.unitId);

        if (!unit || unit.course_id !== courseId) {
            throw new TeacherServiceError(
                "La unidad seleccionada no pertenece a este curso.",
                400,
            );
        }

        const uniqueStudentIds = new Set<number>();

        for (const record of input.records) {
            if (uniqueStudentIds.has(record.studentId)) {
                throw new TeacherServiceError(
                    "No puedes enviar alumnos duplicados en la misma captura.",
                    400,
                );
            }

            uniqueStudentIds.add(record.studentId);
            ensureStudentBelongsToCourse(courseId, record.studentId);
        }

        upsertCourseGradeEntries(courseId, input.unitId, input.records);

        recalculateRiskForRecords(courseId, [...uniqueStudentIds]);

        return buildCourseGradesResponse(courseId, input.unitId);
    }
}