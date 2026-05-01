import type { StudentDto, GroupStudentDto, StudentImportDuplicateDto, StudentImportErrorDto, StudentImportResultDto, StudentTrafficLightFilterDto, } from "@/shared/dtos/director/students.dto";
import { buildAcademicCyclesForYear, getAcademicCycleStatus, getCurrentAcademicCycleDefinition, } from "@/server/domains/director/academic-cycle-calculation";
import type { DirectorUserDetailDto, DirectorUserListItemDto, TeacherCandidateForTutorAssignmentDto, } from "@/shared/dtos/director/users.dto";
import type { CycleDto, GroupDto, SubjectDto, CourseDto, GroupTutorDto, } from "@/shared/dtos/director/academic.dto";
import { incrementUserSessionVersion, setUserActiveStatusAndInvalidateSessions, } from "@/server/auth/repo";
import type { CreateSubjectInput, UpdateSubjectInput, } from "@/shared/schemas/director/subject.schema";
import type { CreateStudentInput, UpdateStudentInput, } from "@/shared/schemas/director/student.schema";
import type { CreateUserInput, UpdateUserInput, } from "@/shared/schemas/director/user.schema";
import type { ImportStudentsInput } from "@/shared/schemas/director/student-import.schema";
import type { AssignTutorInput } from "@/shared/schemas/director/tutor-assignment.schema";
import type { CreateCourseInput } from "@/shared/schemas/director/course.schema";
import type { UpdateGroupInput } from "@/shared/schemas/director/group.schema";
import { hashPassword } from "@/server/auth/password";
import { ROLE } from "@/shared/enums/roles";
import { z } from "zod";

import { directorRepo } from "./repo";


const emailSchema = z.string().email("Correo inválido");

class DirectorServiceError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status = 400,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = "DirectorServiceError";
    }
}

function normalizeOptionalString(value?: string) {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

function normalizeRequiredString(value: string) {
    return value.trim();
}

function parseTrafficLightCausesJson(value: string | null) {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed;
    } catch {
        return [];
    }
}

function mapUser(row: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: number;
    must_change_password: number;
    created_at: string;
    role_code: string;
}): DirectorUserListItemDto {
    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        isActive: Boolean(row.is_active),
        mustChangePassword: Boolean(row.must_change_password),
        role: row.role_code as DirectorUserListItemDto["role"],
        createdAt: row.created_at,
    };
}

function mapTeacherCandidate(row: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: number;
}): TeacherCandidateForTutorAssignmentDto {
    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: `${row.first_name} ${row.last_name}`.trim(),
        email: row.email,
        isActive: Boolean(row.is_active),
    };
}

function mapCycle(row: {
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
}): CycleDto {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        year: row.year,
        ordinal: row.ordinal as CycleDto["ordinal"],
        status: getAcademicCycleStatus({
            startDate: row.start_date,
            endDate: row.end_date,
        }),
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapGroup(row: {
    id: number;
    cycle_id: number;
    cycle_code: string;
    cycle_name: string;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
}): GroupDto {
    return {
        id: row.id,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        cycleName: row.cycle_name,
        code: row.code,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapSubject(row: {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
}): SubjectDto {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapStudent(row: {
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
}): StudentDto {
    return {
        id: row.id,
        controlNumber: row.control_number,
        firstName: row.first_name,
        lastName: row.last_name,
        secondLastName: row.second_last_name,
        email: row.email,
        phone: row.phone,
        isActive: Boolean(row.is_active),
        trafficLight: row.traffic_light as StudentDto["trafficLight"],
        trafficLightCauses: parseTrafficLightCausesJson(row.traffic_light_causes_json),
        trafficLightCalculatedAt: row.traffic_light_calculated_at,
        redCausesCount: row.red_causes_count ?? 0,
        yellowCausesCount: row.yellow_causes_count ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapGroupStudent(row: {
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
}): GroupStudentDto {
    return {
        id: row.id,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        groupId: row.group_id,
        groupCode: row.group_code,
        studentId: row.student_id,
        controlNumber: row.control_number,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        trafficLight: row.traffic_light as GroupStudentDto["trafficLight"],
        trafficLightCauses: parseTrafficLightCausesJson(row.traffic_light_causes_json),
        trafficLightCalculatedAt: row.traffic_light_calculated_at,
        redCausesCount: row.red_causes_count ?? 0,
        yellowCausesCount: row.yellow_causes_count ?? 0,
        assignedAt: row.assigned_at,
    };
}

function mapCourse(row: {
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
}): CourseDto {
    return {
        id: row.id,
        cycleId: row.cycle_id,
        cycleCode: row.cycle_code,
        groupId: row.group_id,
        groupCode: row.group_code,
        subjectId: row.subject_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        teacherUserId: row.teacher_user_id,
        teacherName: row.teacher_name,
        teacherEmail: row.teacher_email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapGroupTutor(row: {
    id: number;
    group_id: number;
    group_code: string;
    group_name: string;
    tutor_user_id: number;
    tutor_name: string;
    tutor_email: string;
    created_at: string;
    updated_at: string;
}): GroupTutorDto {
    return {
        id: row.id,
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
        tutorUserId: row.tutor_user_id,
        tutorName: row.tutor_name,
        tutorEmail: row.tutor_email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function ensureAcademicCyclesForYear(year: number) {
    const definitions = buildAcademicCyclesForYear(year);

    for (const definition of definitions) {
        const existing = directorRepo.findCycleByYearAndOrdinal(
            definition.year,
            definition.ordinal,
        );

        if (!existing) {
            directorRepo.createAutomaticCycle({
                code: definition.code,
                name: definition.name,
                startDate: definition.startDate,
                endDate: definition.endDate,
                year: definition.year,
                ordinal: definition.ordinal,
                isActive: true,
            });

            continue;
        }

        if (
            existing.code !== definition.code ||
            existing.name !== definition.name ||
            existing.start_date !== definition.startDate ||
            existing.end_date !== definition.endDate ||
            existing.year !== definition.year ||
            existing.ordinal !== definition.ordinal
        ) {
            directorRepo.updateAutomaticCycle(existing.id, {
                code: definition.code,
                name: definition.name,
                startDate: definition.startDate,
                endDate: definition.endDate,
                year: definition.year,
                ordinal: definition.ordinal,
                isActive: Boolean(existing.is_active),
            });
        }
    }
}

function ensureAcademicCyclesAroundCurrentDate() {
    const today = new Date();
    const currentYear = today.getFullYear();

    ensureAcademicCyclesForYear(currentYear - 1);
    ensureAcademicCyclesForYear(currentYear);
    ensureAcademicCyclesForYear(currentYear + 1);
}

export const directorService = {
    async listOperationalUsers(): Promise<DirectorUserListItemDto[]> {
        return directorRepo.listOperationalUsers().map(mapUser);
    },

    async listTeacherCandidatesForTutorAssignment(): Promise<TeacherCandidateForTutorAssignmentDto[]> {
        return directorRepo.listTeacherCandidatesForTutorAssignment().map(mapTeacherCandidate);
    },

    async getOperationalUser(userId: number): Promise<DirectorUserDetailDto> {
        const user = directorRepo.findUserById(userId);

        if (!user) {
            throw new DirectorServiceError("USER_NOT_FOUND", "Usuario no encontrado", 404);
        }

        if (!["TEACHER", "PEDAGOGIA", "PSICOLOGIA"].includes(user.role_code)) {
            throw new DirectorServiceError(
                "INVALID_OPERATIONAL_USER",
                "El usuario no pertenece al módulo operativo",
                400,
            );
        }

        return mapUser(user);
    },

    async createOperationalUser(input: CreateUserInput): Promise<DirectorUserDetailDto> {
        const existingUser = directorRepo.findUserByEmail(input.email);

        if (existingUser) {
            throw new DirectorServiceError("EMAIL_ALREADY_EXISTS", "El correo ya está registrado", 409);
        }

        const passwordHash = await hashPassword(input.password);

        const newUserId = directorRepo.createOperationalUser({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            passwordHash,
            mustChangePassword: input.mustChangePassword,
            roleCode: input.role,
        });

        return this.getOperationalUser(newUserId);
    },

    async updateOperationalUser(userId: number, input: UpdateUserInput): Promise<DirectorUserDetailDto> {
        const current = directorRepo.findUserById(userId);

        if (!current) {
            throw new DirectorServiceError("USER_NOT_FOUND", "Usuario no encontrado", 404);
        }

        if (input.email && input.email !== current.email) {
            const existingUser = directorRepo.findUserByEmail(input.email);
            if (existingUser) {
                throw new DirectorServiceError("EMAIL_ALREADY_EXISTS", "El correo ya está registrado", 409);
            }
        }

        const isActiveChanged =
            input.isActive !== undefined &&
            Boolean(current.is_active) !== input.isActive;

        directorRepo.updateOperationalUser(userId, input);

        if (isActiveChanged) {
            setUserActiveStatusAndInvalidateSessions(userId, input.isActive!);
        } else {
            const emailChanged =
                input.email !== undefined &&
                input.email.trim().toLowerCase() !== current.email.toLowerCase();

            if (emailChanged) {
                incrementUserSessionVersion(userId);
            }
        }

        return this.getOperationalUser(userId);
    },

    async listCycles(): Promise<CycleDto[]> {
        ensureAcademicCyclesAroundCurrentDate();

        return directorRepo.listCycles().map(mapCycle);
    },

    async getCurrentCycle(): Promise<CycleDto> {
        const currentDefinition = getCurrentAcademicCycleDefinition();

        ensureAcademicCyclesForYear(currentDefinition.year);

        const cycle = directorRepo.findCycleByYearAndOrdinal(
            currentDefinition.year,
            currentDefinition.ordinal,
        );

        if (!cycle) {
            throw new DirectorServiceError(
                "CURRENT_CYCLE_NOT_FOUND",
                "No se pudo resolver el ciclo actual",
                500,
            );
        }

        return mapCycle(cycle);
    },

    async getCycle(cycleId: number): Promise<CycleDto> {
        ensureAcademicCyclesAroundCurrentDate();

        const cycle = directorRepo.findCycleById(cycleId);

        if (!cycle) {
            throw new DirectorServiceError("CYCLE_NOT_FOUND", "Ciclo no encontrado", 404);
        }

        return mapCycle(cycle);
    },

    async listGroups(): Promise<GroupDto[]> {
        ensureAcademicCyclesAroundCurrentDate();

        return directorRepo.listGroups().map(mapGroup);
    },

    async getGroup(groupId: number): Promise<GroupDto> {
        const group = directorRepo.findGroupById(groupId);

        if (!group) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "Grupo no encontrado", 404);
        }

        return mapGroup(group);
    },

    async createGroup(input: { code: string; name: string }): Promise<GroupDto> {
        const currentCycle = await this.getCurrentCycle();

        const code = normalizeRequiredString(input.code);
        const name = normalizeRequiredString(input.name);

        const duplicate = directorRepo.findGroupByCycleAndCode(currentCycle.id, code);

        if (duplicate) {
            throw new DirectorServiceError(
                "GROUP_CODE_EXISTS",
                "Ya existe un grupo con ese código dentro del ciclo actual",
                409,
            );
        }

        const groupId = directorRepo.createGroup({
            cycleId: currentCycle.id,
            code,
            name,
        });

        return this.getGroup(groupId);
    },

    async updateGroup(groupId: number, input: UpdateGroupInput): Promise<GroupDto> {
        const current = directorRepo.findGroupById(groupId);

        if (!current) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "Grupo no encontrado", 404);
        }

        if (input.code && input.code !== current.code) {
            const duplicate = directorRepo.findGroupByCycleAndCode(current.cycle_id, input.code);

            if (duplicate) {
                throw new DirectorServiceError(
                    "GROUP_CODE_EXISTS",
                    "Ya existe un grupo con ese código dentro del ciclo",
                    409,
                );
            }
        }

        directorRepo.updateGroup(groupId, input);
        return this.getGroup(groupId);
    },

    async listSubjects(): Promise<SubjectDto[]> {
        return directorRepo.listSubjects().map(mapSubject);
    },

    async getSubject(subjectId: number): Promise<SubjectDto> {
        const subject = directorRepo.findSubjectById(subjectId);

        if (!subject) {
            throw new DirectorServiceError("SUBJECT_NOT_FOUND", "Materia no encontrada", 404);
        }

        return mapSubject(subject);
    },

    async createSubject(input: CreateSubjectInput): Promise<SubjectDto> {
        const duplicate = directorRepo.findSubjectByCode(input.code);

        if (duplicate) {
            throw new DirectorServiceError("SUBJECT_CODE_EXISTS", "Ya existe una materia con ese código", 409);
        }

        const subjectId = directorRepo.createSubject(input);
        return this.getSubject(subjectId);
    },

    async updateSubject(subjectId: number, input: UpdateSubjectInput): Promise<SubjectDto> {
        const current = directorRepo.findSubjectById(subjectId);

        if (!current) {
            throw new DirectorServiceError("SUBJECT_NOT_FOUND", "Materia no encontrada", 404);
        }

        if (input.code && input.code !== current.code) {
            const duplicate = directorRepo.findSubjectByCode(input.code);

            if (duplicate) {
                throw new DirectorServiceError("SUBJECT_CODE_EXISTS", "Ya existe una materia con ese código", 409);
            }
        }

        directorRepo.updateSubject(subjectId, input);
        return this.getSubject(subjectId);
    },

    async listStudents(params?: {
        trafficLight?: StudentTrafficLightFilterDto;
    }): Promise<StudentDto[]> {
        return directorRepo.listStudents(params).map(mapStudent);
    },

    async getStudent(studentId: number): Promise<StudentDto> {
        const student = directorRepo.findStudentById(studentId);

        if (!student) {
            throw new DirectorServiceError("STUDENT_NOT_FOUND", "Alumno no encontrado", 404);
        }

        return mapStudent(student);
    },

    async createStudent(input: CreateStudentInput): Promise<StudentDto> {
        const duplicate = directorRepo.findStudentByControlNumber(input.controlNumber);

        if (duplicate) {
            throw new DirectorServiceError(
                "CONTROL_NUMBER_EXISTS",
                "Ya existe un alumno con ese número de control",
                409,
            );
        }

        const group = directorRepo.findGroupCycle(input.groupId);

        if (!group) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "El grupo no existe", 404);
        }

        const studentId = directorRepo.createStudentWithAssignment({
            controlNumber: input.controlNumber,
            firstName: input.firstName,
            lastName: input.lastName,
            secondLastName: normalizeOptionalString(input.secondLastName) ?? null,
            email: normalizeOptionalString(input.email)?.toLowerCase() ?? null,
            phone: normalizeOptionalString(input.phone) ?? null,
            groupId: input.groupId,
            cycleId: group.cycle_id,
        });

        return this.getStudent(studentId);
    },

    async importStudents(input: ImportStudentsInput): Promise<StudentImportResultDto> {
        if (input.rows.length === 0) {
            throw new DirectorServiceError(
                "STUDENT_IMPORT_EMPTY",
                "El archivo no contiene filas para importar",
                400,
            );
        }

        const group = directorRepo.findGroupById(input.groupId);

        if (!group) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "El grupo no existe", 404);
        }

        const errors: StudentImportErrorDto[] = [];
        const duplicates: StudentImportDuplicateDto[] = [];

        const normalizedRows = input.rows.map((row) => ({
            rowNumber: row.rowNumber,
            controlNumber: normalizeRequiredString(row.controlNumber),
            firstName: normalizeRequiredString(row.firstName),
            lastName: normalizeRequiredString(row.lastName),
            secondLastName: normalizeOptionalString(row.secondLastName) ?? null,
            email: normalizeOptionalString(row.email)?.toLowerCase() ?? null,
            phone: normalizeOptionalString(row.phone) ?? null,
        }));

        const seenControlNumbers = new Map<string, number>();
        const invalidRowNumbers = new Set<number>();
        const duplicateRowNumbers = new Set<number>();

        for (const row of normalizedRows) {
            if (!row.controlNumber) {
                invalidRowNumbers.add(row.rowNumber);
                errors.push({
                    rowNumber: row.rowNumber,
                    field: "controlNumber",
                    message: "El número de control es obligatorio.",
                });
            }

            if (!row.firstName) {
                invalidRowNumbers.add(row.rowNumber);
                errors.push({
                    rowNumber: row.rowNumber,
                    field: "firstName",
                    message: "El nombre es obligatorio.",
                });
            }

            if (!row.lastName) {
                invalidRowNumbers.add(row.rowNumber);
                errors.push({
                    rowNumber: row.rowNumber,
                    field: "lastName",
                    message: "El apellido paterno es obligatorio.",
                });
            }

            if (row.email) {
                const emailValidation = emailSchema.safeParse(row.email);

                if (!emailValidation.success) {
                    invalidRowNumbers.add(row.rowNumber);
                    errors.push({
                        rowNumber: row.rowNumber,
                        field: "email",
                        message: "El correo no tiene un formato válido.",
                    });
                }
            }

            if (row.controlNumber) {
                const duplicateRow = seenControlNumbers.get(row.controlNumber);

                if (duplicateRow !== undefined) {
                    duplicateRowNumbers.add(row.rowNumber);
                    duplicates.push({
                        rowNumber: row.rowNumber,
                        controlNumber: row.controlNumber,
                        reason: "DUPLICATE_IN_FILE",
                        message: `Número de control duplicado dentro del archivo. Ya apareció en la fila ${duplicateRow}.`,
                    });
                } else {
                    seenControlNumbers.set(row.controlNumber, row.rowNumber);
                }
            }
        }

        const controlNumbers = normalizedRows
            .map((row) => row.controlNumber)
            .filter((value) => value.length > 0);

        const existingStudents = directorRepo.findStudentsByControlNumbers(controlNumbers);
        const existingControlNumbers = new Set(existingStudents.map((student) => student.control_number));

        for (const row of normalizedRows) {
            if (row.controlNumber && existingControlNumbers.has(row.controlNumber)) {
                duplicateRowNumbers.add(row.rowNumber);
                duplicates.push({
                    rowNumber: row.rowNumber,
                    controlNumber: row.controlNumber,
                    reason: "DUPLICATE_IN_DATABASE",
                    message: "Ya existe un alumno registrado con ese número de control.",
                });
            }
        }

        const validRows = normalizedRows.filter(
            (row) =>
                !invalidRowNumbers.has(row.rowNumber) &&
                !duplicateRowNumbers.has(row.rowNumber),
        );

        const importResult =
            validRows.length > 0
                ? directorRepo.bulkCreateStudentsWithAssignment({
                    groupId: input.groupId,
                    cycleId: group.cycle_id,
                    rows: validRows.map((row) => ({
                        rowNumber: row.rowNumber,
                        controlNumber: row.controlNumber,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        secondLastName: row.secondLastName,
                        email: row.email,
                        phone: row.phone,
                    })),
                })
                : {
                    createdStudents: 0,
                    assignedStudents: 0,
                    importedStudents: [],
                };

        return {
            groupId: group.id,
            groupCode: group.code,
            groupName: group.name,
            cycleId: group.cycle_id,
            totalRows: normalizedRows.length,
            createdStudents: importResult.createdStudents,
            assignedStudents: importResult.assignedStudents,
            duplicateStudents: duplicates.length,
            failedRows: errors.length,
            importedStudents: importResult.importedStudents,
            duplicates,
            errors,
        };
    },

    async updateStudent(studentId: number, input: UpdateStudentInput): Promise<StudentDto> {
        const current = directorRepo.findStudentById(studentId);

        if (!current) {
            throw new DirectorServiceError("STUDENT_NOT_FOUND", "Alumno no encontrado", 404);
        }

        directorRepo.updateStudent(studentId, {
            firstName: input.firstName,
            lastName: input.lastName,
            secondLastName:
                input.secondLastName !== undefined
                    ? normalizeOptionalString(input.secondLastName)
                    : undefined,
            email:
                input.email !== undefined
                    ? normalizeOptionalString(input.email)?.toLowerCase() ?? null
                    : undefined,
            phone:
                input.phone !== undefined
                    ? normalizeOptionalString(input.phone) ?? null
                    : undefined,
            isActive: input.isActive,
        });

        return this.getStudent(studentId);
    },

    async listStudentsByGroup(
        groupId: number,
        params?: {
            trafficLight?: StudentTrafficLightFilterDto;
        },
    ): Promise<GroupStudentDto[]> {
        const group = directorRepo.findGroupById(groupId);

        if (!group) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "Grupo no encontrado", 404);
        }

        return directorRepo.listStudentsByGroup(groupId, params).map(mapGroupStudent);
    },

    async listCourses(): Promise<CourseDto[]> {
        const currentCycle = await this.getCurrentCycle();

        return directorRepo.listCoursesByCycle(currentCycle.id).map(mapCourse);
    },

    async createCourse(input: CreateCourseInput): Promise<CourseDto> {
        const currentCycle = await this.getCurrentCycle();

        const group = directorRepo.findGroupById(input.groupId);
        if (!group) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "El grupo no existe", 404);
        }

        if (group.cycle_id !== currentCycle.id) {
            throw new DirectorServiceError(
                "GROUP_CYCLE_MISMATCH",
                "El grupo no pertenece al ciclo actual",
                400,
            );
        }

        const subject = directorRepo.findSubjectById(input.subjectId);
        if (!subject) {
            throw new DirectorServiceError("SUBJECT_NOT_FOUND", "La materia no existe", 404);
        }

        const teacher = directorRepo.findUserById(input.teacherUserId);
        if (!teacher) {
            throw new DirectorServiceError("TEACHER_NOT_FOUND", "El docente no existe", 404);
        }

        const roles = directorRepo.getUserRoles(input.teacherUserId);
        const hasTeacherRole = roles.some((role) => role.code === ROLE.TEACHER);

        if (!hasTeacherRole) {
            throw new DirectorServiceError(
                "USER_IS_NOT_TEACHER",
                "El usuario seleccionado no tiene rol docente",
                400,
            );
        }

        if (!teacher.is_active) {
            throw new DirectorServiceError(
                "TEACHER_INACTIVE",
                "El docente seleccionado está inactivo",
                400,
            );
        }

        const duplicate = directorRepo.findCourseDuplicate({
            cycleId: currentCycle.id,
            groupId: input.groupId,
            subjectId: input.subjectId,
            teacherUserId: input.teacherUserId,
        });

        if (duplicate) {
            throw new DirectorServiceError(
                "COURSE_DUPLICATE",
                "Ya existe ese curso asignado al docente en el ciclo actual",
                409,
            );
        }

        const courseId = directorRepo.createCourse({
            cycleId: currentCycle.id,
            groupId: input.groupId,
            subjectId: input.subjectId,
            teacherUserId: input.teacherUserId,
        });

        const created = directorRepo.findCourseById(courseId);

        if (!created) {
            throw new DirectorServiceError("COURSE_NOT_FOUND", "Curso no encontrado", 404);
        }

        return mapCourse(created);
    },

    async listGroupTutors(): Promise<GroupTutorDto[]> {
        return directorRepo.listGroupTutors().map(mapGroupTutor);
    },

    async assignTutor(input: AssignTutorInput): Promise<GroupTutorDto> {
        const group = directorRepo.findGroupById(input.groupId);

        if (!group) {
            throw new DirectorServiceError("GROUP_NOT_FOUND", "El grupo no existe", 404);
        }

        const teacher = directorRepo.findUserById(input.tutorUserId);

        if (!teacher) {
            throw new DirectorServiceError("TEACHER_NOT_FOUND", "El docente no existe", 404);
        }

        if (!teacher.is_active) {
            throw new DirectorServiceError(
                "TEACHER_INACTIVE",
                "El docente seleccionado está inactivo",
                400,
            );
        }

        const roles = directorRepo.getUserRoles(input.tutorUserId);
        const hasTeacherRole = roles.some((role) => role.code === ROLE.TEACHER);

        if (!hasTeacherRole) {
            throw new DirectorServiceError(
                "USER_IS_NOT_TEACHER",
                "Solo un docente puede ser asignado como tutor",
                400,
            );
        }

        directorRepo.addRoleToUser(input.tutorUserId, ROLE.TUTOR);

        const previousTutorUserId = directorRepo.assignTutor({
            groupId: input.groupId,
            tutorUserId: input.tutorUserId,
        });

        if (previousTutorUserId && previousTutorUserId !== input.tutorUserId) {
            const previousStillAssigned =
                directorRepo.findAnyGroupTutorByTutorUserId(previousTutorUserId);

            if (!previousStillAssigned) {
                directorRepo.removeRoleFromUser(previousTutorUserId, ROLE.TUTOR);
                incrementUserSessionVersion(previousTutorUserId);
            }
        }

        incrementUserSessionVersion(input.tutorUserId);

        const assignment = directorRepo.findGroupTutorByGroupId(input.groupId);

        if (!assignment) {
            throw new DirectorServiceError(
                "TUTOR_ASSIGNMENT_NOT_FOUND",
                "No se pudo recuperar la asignación de tutor",
                500,
            );
        }

        return mapGroupTutor(assignment);
    },
};

export { DirectorServiceError };