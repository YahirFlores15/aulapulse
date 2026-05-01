import type { ChangeReferralTargetInput, CloseReferralCaseInput, DirectorReferralFiltersInput, DirectorReferralNoteInput, ReopenReferralCaseInput, } from "@/shared/schemas/referrals/referral-workflow.schema";
import type { RoleCode } from "@/shared/enums/roles";

import { changeReferralCaseTarget, closeReferralCase, createReferralCaseEvent, createReferralCaseWorkflowNote, getReferralCaseForWorkflow, getReferralCaseWorkflowDetail, listReferralCasesForDirector, listReferralCaseNotesForWorkflow, reopenReferralCase, } from "./repo";
import { canAddReferralNote, canChangeReferralTarget, canCloseReferralCase, canReopenReferralCase, canViewReferralCase, } from "./policies";
import { ReferralWorkflowError } from "./errors";


function assertCaseExists(caseId: number) {
    const caseItem = getReferralCaseForWorkflow(caseId);

    if (!caseItem) {
        throw new ReferralWorkflowError("Caso no encontrado.", 404);
    }

    return caseItem;
}

function toAccessContext(caseItem: ReturnType<typeof getReferralCaseForWorkflow> extends infer T
    ? T extends null
    ? never
    : T
    : never) {
    return {
        createdByUserId: caseItem.createdByUserId,
        tutorUserId: caseItem.tutorUserId,
        targetArea: caseItem.targetArea,
        relatedTeacherUserId: caseItem.relatedTeacherUserId,
    };
}

function assertCanView(actorUserId: number, actorRoles: readonly RoleCode[], caseId: number) {
    const caseItem = assertCaseExists(caseId);

    if (!canViewReferralCase(actorUserId, actorRoles, toAccessContext(caseItem))) {
        throw new ReferralWorkflowError("No tienes permisos para ver este caso.", 403);
    }

    return caseItem;
}

function assertCanAddNote(actorUserId: number, actorRoles: readonly RoleCode[], caseId: number) {
    const caseItem = assertCaseExists(caseId);

    if (!canAddReferralNote(actorUserId, actorRoles, toAccessContext(caseItem))) {
        throw new ReferralWorkflowError("No tienes permisos para agregar notas a este caso.", 403);
    }

    return caseItem;
}

function assertCanClose(actorUserId: number, actorRoles: readonly RoleCode[], caseId: number) {
    const caseItem = assertCaseExists(caseId);

    if (!canCloseReferralCase(actorUserId, actorRoles, toAccessContext(caseItem))) {
        throw new ReferralWorkflowError("No tienes permisos para cerrar este caso.", 403);
    }

    return caseItem;
}

function assertCanReopen(actorUserId: number, actorRoles: readonly RoleCode[], caseId: number) {
    const caseItem = assertCaseExists(caseId);

    if (!canReopenReferralCase(actorUserId, actorRoles, toAccessContext(caseItem))) {
        throw new ReferralWorkflowError("No tienes permisos para reabrir este caso.", 403);
    }

    return caseItem;
}

function assertCanChangeTarget(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    caseId: number,
) {
    const caseItem = assertCaseExists(caseId);

    if (!canChangeReferralTarget(actorUserId, actorRoles, toAccessContext(caseItem))) {
        throw new ReferralWorkflowError("No tienes permisos para cambiar el área destino.", 403);
    }

    return caseItem;
}

export function listDirectorReferralCases(filters: DirectorReferralFiltersInput) {
    return listReferralCasesForDirector(filters).map(({ tutorUserId: _tutorUserId, ...caseItem }) => caseItem);
}

export function getReferralCaseDetailForActor(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    caseId: number,
) {
    assertCanView(actorUserId, actorRoles, caseId);

    const detail = getReferralCaseWorkflowDetail(caseId);

    if (!detail) {
        throw new ReferralWorkflowError("No se pudo recuperar el detalle del caso.", 500);
    }

    return detail;
}

export function addReferralNoteForActor(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    caseId: number,
    input: DirectorReferralNoteInput,
) {
    const caseItem = assertCanAddNote(actorUserId, actorRoles, caseId);

    if (caseItem.status === "CLOSED") {
        throw new ReferralWorkflowError("No se pueden agregar notas a un caso cerrado.", 409);
    }

    const noteId = createReferralCaseWorkflowNote({
        caseId,
        authorUserId: actorUserId,
        note: input.note.trim(),
    });

    createReferralCaseEvent({
        caseId,
        eventType: "NOTE_ADDED",
        actorUserId,
        note: input.note.trim(),
    });

    const notes = listReferralCaseNotesForWorkflow(caseId);
    const createdNote = notes.find((note) => note.id === noteId);

    if (!createdNote) {
        throw new ReferralWorkflowError("No se pudo recuperar la nota recién creada.", 500);
    }

    return createdNote;
}

export function closeReferralCaseForActor(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    caseId: number,
    input: CloseReferralCaseInput,
) {
    const caseItem = assertCanClose(actorUserId, actorRoles, caseId);

    if (caseItem.status === "CLOSED") {
        throw new ReferralWorkflowError("El caso ya está cerrado.", 409);
    }

    closeReferralCase({
        caseId,
        actorUserId,
    });

    createReferralCaseEvent({
        caseId,
        eventType: "CASE_CLOSED",
        actorUserId,
        fromValue: "OPEN",
        toValue: "CLOSED",
        note: input.note?.trim() || null,
    });

    return getReferralCaseDetailForActor(actorUserId, actorRoles, caseId);
}

export function reopenReferralCaseForActor(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    caseId: number,
    input: ReopenReferralCaseInput,
) {
    const caseItem = assertCanReopen(actorUserId, actorRoles, caseId);

    if (caseItem.status === "OPEN") {
        throw new ReferralWorkflowError("El caso ya está abierto.", 409);
    }

    reopenReferralCase({
        caseId,
        actorUserId,
    });

    createReferralCaseEvent({
        caseId,
        eventType: "CASE_REOPENED",
        actorUserId,
        fromValue: "CLOSED",
        toValue: "OPEN",
        note: input.note.trim(),
    });

    return getReferralCaseDetailForActor(actorUserId, actorRoles, caseId);
}

export function changeReferralTargetForActor(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    caseId: number,
    input: ChangeReferralTargetInput,
) {
    const caseItem = assertCanChangeTarget(actorUserId, actorRoles, caseId);

    if (caseItem.targetArea === input.targetArea) {
        throw new ReferralWorkflowError("El caso ya está asignado a esa área destino.", 409);
    }

    changeReferralCaseTarget({
        caseId,
        targetArea: input.targetArea,
    });

    createReferralCaseEvent({
        caseId,
        eventType: "TARGET_CHANGED",
        actorUserId,
        fromValue: caseItem.targetArea,
        toValue: input.targetArea,
        note: input.note?.trim() || null,
    });

    return getReferralCaseDetailForActor(actorUserId, actorRoles, caseId);
}