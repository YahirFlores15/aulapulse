import { closeReferralCaseForActor, getReferralCaseDetailForActor, reopenReferralCaseForActor, } from "@/server/domains/referrals/service";
import type { ReferralCaseDetailDto, ReferralCaseDto, ReferralCaseNoteDto, ReferralReasonDto, } from "@/shared/dtos/tutor/referrals.dto";
import type { TutorGroupDto, TutorGroupStudentsResponseDto, TutorStudentRiskSummaryDto, } from "@/shared/dtos/tutor/groups.dto";
import { closeReferralCaseSchema, reopenReferralCaseSchema, } from "@/shared/schemas/referrals/referral-workflow.schema";
import type { CreateReferralInput, UpdateReferralSummaryInput, } from "@/shared/schemas/tutor/referral.schema";
import { sendReferralCreatedEmailSafely } from "@/server/domains/notifications/email.service";
import type { CreateReferralNoteInput } from "@/shared/schemas/tutor/referral-note.schema";
import { getPersistedStudentTrafficLight } from "@/server/domains/risk/service";
import { referralTargetAreaSchema } from "@/shared/enums/referral-target-area";
import { notifyReferralCreated } from "@/server/domains/notifications/service";
import { createReferralCaseEvent } from "@/server/domains/referrals/repo";
import { caseStatusSchema } from "@/shared/enums/case-status";
import { ROLE } from "@/shared/enums/roles";

import { createReferralCase, createReferralCaseNote, getReferralCaseById, getReferralReasonByCode, getStudentInTutorGroup, getTutorGroupById, listGroupStudents, listReferralCaseEvents, listReferralCaseNotes, listReferralCasesByTutor, listReferralReasons, listStudentSubjectsForGroup, listTutorGroups, updateReferralCaseSummary, } from "./repo";


export class TutorServiceError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "TutorServiceError";
        this.status = status;
    }
}

function normalizeReferralCase(caseItem: ReturnType<typeof getReferralCaseById>): ReferralCaseDto | null {
    if (!caseItem) {
        return null;
    }

    return {
        ...caseItem,
        status: caseStatusSchema.parse(caseItem.status),
        targetArea: referralTargetAreaSchema.parse(caseItem.targetArea),
    };
}

function normalizeReferralCases(caseItems: ReturnType<typeof listReferralCasesByTutor>): ReferralCaseDto[] {
    return caseItems.map((caseItem) => ({
        ...caseItem,
        status: caseStatusSchema.parse(caseItem.status),
        targetArea: referralTargetAreaSchema.parse(caseItem.targetArea),
    }));
}

function mapWorkflowDetailToTutorDetail(
    detail: ReturnType<typeof getReferralCaseDetailForActor>,
): ReferralCaseDetailDto {
    return {
        case: {
            id: detail.caseItem.id,
            studentId: detail.caseItem.studentId,
            studentControlNumber: detail.caseItem.studentControlNumber,
            studentName: detail.caseItem.studentFullName,
            groupId: detail.caseItem.groupId,
            groupCode: detail.caseItem.groupCode,
            createdByUserId: detail.caseItem.createdByUserId,
            createdByName: detail.caseItem.createdByName,
            reasonCode: detail.caseItem.reasonCode,
            reasonName: detail.caseItem.reasonName,
            status: caseStatusSchema.parse(detail.caseItem.status),
            summary: detail.caseItem.summary,
            targetArea: referralTargetAreaSchema.parse(detail.caseItem.targetArea),
            sharedWithSupport: detail.caseItem.sharedWithSupport,
            openedAt: detail.caseItem.openedAt,
            closedAt: detail.caseItem.closedAt,
            closedByUserId: detail.caseItem.closedByUserId,
            closedByName: detail.caseItem.closedByName,
            reopenedAt: detail.caseItem.reopenedAt,
            reopenedByUserId: detail.caseItem.reopenedByUserId,
            reopenedByName: detail.caseItem.reopenedByName,
            createdAt: detail.caseItem.createdAt,
            updatedAt: detail.caseItem.updatedAt,
            lastStatusChangedAt: detail.caseItem.lastStatusChangedAt,
        },
        notes: detail.notes,
        events: detail.events,
    };
}

function ensureGroupAccess(groupId: number, tutorUserId: number): TutorGroupDto {
    const group = getTutorGroupById(groupId, tutorUserId);

    if (!group) {
        throw new TutorServiceError("Grupo no encontrado o sin permisos.", 404);
    }

    return group;
}

function ensureCaseAccess(caseId: number, tutorUserId: number): ReferralCaseDto {
    const referralCase = normalizeReferralCase(getReferralCaseById(caseId, tutorUserId));

    if (!referralCase) {
        throw new TutorServiceError("Caso no encontrado o sin permisos.", 404);
    }

    return referralCase;
}

export function listAssignedGroups(tutorUserId: number): TutorGroupDto[] {
    return listTutorGroups(tutorUserId);
}

export function getGroupStudentsWithRisk(
    groupId: number,
    tutorUserId: number,
): TutorGroupStudentsResponseDto {
    const group = ensureGroupAccess(groupId, tutorUserId);
    const students = listGroupStudents(groupId);
    const subjectRows = listStudentSubjectsForGroup(groupId);

    const subjectsByStudent = new Map<number, TutorStudentRiskSummaryDto["subjects"]>();

    for (const row of subjectRows) {
        const current = subjectsByStudent.get(row.studentId) ?? [];
        current.push({
            courseId: row.courseId,
            subjectId: row.subjectId,
            subjectCode: row.subjectCode,
            subjectName: row.subjectName,
            teacherUserId: row.teacherUserId,
            teacherName: row.teacherName,
            riskStatus: row.riskStatus,
            isIncomplete: row.isIncomplete,
        });
        subjectsByStudent.set(row.studentId, current);
    }

    return {
        group,
        students: students.map((student) => {
            const trafficLightSnapshot = getPersistedStudentTrafficLight(student.studentId);

            return {
                ...student,
                trafficLight: trafficLightSnapshot?.color ?? null,
                trafficLightCauses: trafficLightSnapshot?.causes ?? [],
                trafficLightCalculatedAt: trafficLightSnapshot?.calculatedAt ?? null,
                subjects: subjectsByStudent.get(student.studentId) ?? [],
            };
        }),
    };
}

export function listAvailableReferralReasons(): ReferralReasonDto[] {
    return listReferralReasons().filter((reason) => reason.isActive);
}

export function listTutorReferralCases(tutorUserId: number): ReferralCaseDto[] {
    return normalizeReferralCases(listReferralCasesByTutor(tutorUserId));
}

export async function createTutorReferralCase(
    tutorUserId: number,
    input: CreateReferralInput,
): Promise<ReferralCaseDto> {
    ensureGroupAccess(input.groupId, tutorUserId);

    const studentInGroup = getStudentInTutorGroup(input.studentId, input.groupId);
    if (!studentInGroup) {
        throw new TutorServiceError(
            "El alumno no pertenece al grupo indicado para la canalización.",
            400,
        );
    }

    const reason = getReferralReasonByCode(input.reasonCode);
    if (!reason || !reason.isActive) {
        throw new TutorServiceError(
            "El motivo de canalización no existe o está inactivo.",
            400,
        );
    }

    const caseId = createReferralCase({
        studentId: input.studentId,
        groupId: input.groupId,
        createdByUserId: tutorUserId,
        reasonCode: input.reasonCode,
        summary: input.summary.trim(),
        targetArea: input.targetArea,
        sharedWithSupport: input.sharedWithSupport,
    });

    createReferralCaseEvent({
        caseId,
        eventType: "CASE_CREATED",
        actorUserId: tutorUserId,
        toValue: "OPEN",
        note: `Área destino inicial: ${input.targetArea}`,
    });

    const createdCase = normalizeReferralCase(getReferralCaseById(caseId, tutorUserId));

    if (!createdCase) {
        throw new TutorServiceError("No se pudo recuperar el caso recién creado.", 500);
    }

    notifyReferralCreated({
        actorUserId: tutorUserId,
        actorName: createdCase.createdByName,
        studentName: createdCase.studentName,
        groupCode: createdCase.groupCode,
        reasonName: createdCase.reasonName,
        caseId: createdCase.id,
        targetArea: createdCase.targetArea,
    });

    await sendReferralCreatedEmailSafely({
        actorUserId: tutorUserId,
        actorName: createdCase.createdByName,
        studentName: createdCase.studentName,
        groupCode: createdCase.groupCode,
        reasonName: createdCase.reasonName,
        targetArea: createdCase.targetArea,
        summary: createdCase.summary,
        caseId: createdCase.id,
    });

    return createdCase;
}

export function getTutorReferralCaseDetail(
    caseId: number,
    tutorUserId: number,
): ReferralCaseDetailDto {
    const referralCase = ensureCaseAccess(caseId, tutorUserId);
    const notes = listReferralCaseNotes(caseId);
    const events = listReferralCaseEvents(caseId);

    return {
        case: referralCase,
        notes,
        events,
    };
}

export function updateTutorReferralCaseSummary(
    caseId: number,
    tutorUserId: number,
    input: UpdateReferralSummaryInput,
): ReferralCaseDto {
    const currentCase = ensureCaseAccess(caseId, tutorUserId);

    updateReferralCaseSummary(caseId, {
        summary: input.summary.trim(),
    });

    const updatedCase = normalizeReferralCase(getReferralCaseById(caseId, tutorUserId));

    if (!updatedCase) {
        throw new TutorServiceError("No se pudo recuperar el caso actualizado.", 500);
    }

    if (currentCase.summary !== updatedCase.summary) {
        createReferralCaseEvent({
            caseId,
            eventType: "NOTE_ADDED",
            actorUserId: tutorUserId,
            note: "Resumen del caso actualizado por tutor.",
        });
    }

    return updatedCase;
}

export function listTutorReferralCaseNotes(
    caseId: number,
    tutorUserId: number,
): ReferralCaseNoteDto[] {
    ensureCaseAccess(caseId, tutorUserId);
    return listReferralCaseNotes(caseId);
}

export function addTutorReferralCaseNote(
    caseId: number,
    tutorUserId: number,
    input: CreateReferralNoteInput,
): ReferralCaseNoteDto {
    const referralCase = ensureCaseAccess(caseId, tutorUserId);

    if (referralCase.status === "CLOSED") {
        throw new TutorServiceError("No se pueden agregar notas a un caso cerrado.", 409);
    }

    const noteText = input.note.trim();

    const noteId = createReferralCaseNote({
        caseId,
        authorUserId: tutorUserId,
        note: noteText,
    });

    createReferralCaseEvent({
        caseId,
        eventType: "NOTE_ADDED",
        actorUserId: tutorUserId,
        note: noteText,
    });

    const notes = listReferralCaseNotes(caseId);
    const createdNote = notes.find((note) => note.id === noteId);

    if (!createdNote) {
        throw new TutorServiceError("No se pudo recuperar la nota recién creada.", 500);
    }

    return createdNote;
}

export function closeTutorReferralCase(
    caseId: number,
    tutorUserId: number,
    rawInput: unknown,
): ReferralCaseDetailDto {
    ensureCaseAccess(caseId, tutorUserId);

    const input = closeReferralCaseSchema.parse(rawInput);

    const detail = closeReferralCaseForActor(
        tutorUserId,
        [ROLE.TUTOR],
        caseId,
        input,
    );

    return mapWorkflowDetailToTutorDetail(detail);
}

export function reopenTutorReferralCase(
    caseId: number,
    tutorUserId: number,
    rawInput: unknown,
): ReferralCaseDetailDto {
    ensureCaseAccess(caseId, tutorUserId);

    const input = reopenReferralCaseSchema.parse(rawInput);

    const detail = reopenReferralCaseForActor(
        tutorUserId,
        [ROLE.TUTOR],
        caseId,
        input,
    );

    return mapWorkflowDetailToTutorDetail(detail);
}