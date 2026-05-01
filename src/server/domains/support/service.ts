import { addReferralNoteForActor, closeReferralCaseForActor, getReferralCaseDetailForActor, listDirectorReferralCases, reopenReferralCaseForActor, } from "@/server/domains/referrals/service";
import { getStudentBasicExpedientByCaseId, listStudentIncidentsForCase, listStudentSubjectsForCase, } from "@/server/domains/support/repo";
import type { CloseReferralCaseInput, ReopenReferralCaseInput, } from "@/shared/schemas/referrals/referral-workflow.schema";
import type { SupportCaseDetailDto, SupportCaseListItemDto, SupportCaseNoteDto, } from "@/shared/dtos/support/support.dto";
import type { SupportCaseNoteInput } from "@/shared/schemas/support/case-note.schema";
import type { SupportCasesQuery } from "@/shared/schemas/support/case.schema";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import type { RoleCode } from "@/shared/enums/roles";


export class SupportServiceError extends Error {
    public readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "SupportServiceError";
        this.status = status;
    }
}

function ensureCaseBelongsToTargetArea(
    caseItem: SupportCaseListItemDto,
    targetArea: ReferralTargetArea,
) {
    if (caseItem.targetArea !== targetArea) {
        throw new SupportServiceError("Caso no encontrado para esta área.", 404);
    }

    return caseItem;
}

function buildExpedient(caseId: number) {
    const expedient = getStudentBasicExpedientByCaseId(caseId);

    if (!expedient) {
        throw new SupportServiceError("No se encontró el expediente del alumno.", 404);
    }

    return {
        ...expedient,
        subjects: listStudentSubjectsForCase(caseId),
        incidents: listStudentIncidentsForCase(caseId),
    };
}

function buildSupportAreaRoles(role: RoleCode): readonly RoleCode[] {
    return [role];
}

export function listSupportAreaCases(params: {
    userId: number;
    role: RoleCode;
    targetArea: ReferralTargetArea;
    query?: SupportCasesQuery;
}): SupportCaseListItemDto[] {
    return listDirectorReferralCases({
        status: params.query?.status,
        targetArea: params.targetArea,
    }).filter((caseItem) => caseItem.targetArea === params.targetArea);
}

export function getSupportAreaCaseDetail(params: {
    userId: number;
    role: RoleCode;
    targetArea: ReferralTargetArea;
    caseId: number;
}): SupportCaseDetailDto {
    const detail = getReferralCaseDetailForActor(
        params.userId,
        buildSupportAreaRoles(params.role),
        params.caseId,
    );

    ensureCaseBelongsToTargetArea(detail.caseItem, params.targetArea);

    return {
        caseItem: detail.caseItem,
        expedient: buildExpedient(params.caseId),
        notes: detail.notes,
        events: detail.events,
    };
}

export function listSupportAreaCaseNotes(params: {
    userId: number;
    role: RoleCode;
    targetArea: ReferralTargetArea;
    caseId: number;
}): SupportCaseNoteDto[] {
    const detail = getSupportAreaCaseDetail(params);
    return detail.notes;
}

export function addSupportAreaCaseNote(
    params: {
        userId: number;
        role: RoleCode;
        targetArea: ReferralTargetArea;
        caseId: number;
    },
    input: SupportCaseNoteInput,
): SupportCaseNoteDto {
    const detail = getSupportAreaCaseDetail(params);

    if (detail.caseItem.status === "CLOSED") {
        throw new SupportServiceError("No se pueden agregar notas a un caso cerrado.", 409);
    }

    return addReferralNoteForActor(
        params.userId,
        buildSupportAreaRoles(params.role),
        params.caseId,
        {
            note: input.note.trim(),
        },
    );
}

export function closeSupportAreaCase(
    params: {
        userId: number;
        role: RoleCode;
        targetArea: ReferralTargetArea;
        caseId: number;
    },
    input: CloseReferralCaseInput,
): SupportCaseDetailDto {
    const detail = closeReferralCaseForActor(
        params.userId,
        buildSupportAreaRoles(params.role),
        params.caseId,
        input,
    );

    ensureCaseBelongsToTargetArea(detail.caseItem, params.targetArea);

    return {
        caseItem: detail.caseItem,
        expedient: buildExpedient(params.caseId),
        notes: detail.notes,
        events: detail.events,
    };
}

export function reopenSupportAreaCase(
    params: {
        userId: number;
        role: RoleCode;
        targetArea: ReferralTargetArea;
        caseId: number;
    },
    input: ReopenReferralCaseInput,
): SupportCaseDetailDto {
    const detail = reopenReferralCaseForActor(
        params.userId,
        buildSupportAreaRoles(params.role),
        params.caseId,
        input,
    );

    ensureCaseBelongsToTargetArea(detail.caseItem, params.targetArea);

    return {
        caseItem: detail.caseItem,
        expedient: buildExpedient(params.caseId),
        notes: detail.notes,
        events: detail.events,
    };
}