import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";


export type ReferralReasonDto = {
    code: string;
    name: string;
    isActive: boolean;
};

export type ReferralCaseDto = {
    id: number;
    studentId: number;
    studentControlNumber: string;
    studentName: string;
    groupId: number;
    groupCode: string;
    createdByUserId: number;
    createdByName: string;
    reasonCode: string;
    reasonName: string;
    status: "OPEN" | "CLOSED";
    summary: string;
    targetArea: ReferralTargetArea;
    sharedWithSupport: boolean;
    openedAt: string;
    closedAt: string | null;
    closedByUserId?: number | null;
    closedByName?: string | null;
    reopenedAt?: string | null;
    reopenedByUserId?: number | null;
    reopenedByName?: string | null;
    createdAt: string;
    updatedAt: string;
    lastStatusChangedAt?: string;
};

export type ReferralCaseNoteDto = {
    id: number;
    caseId: number;
    authorUserId: number;
    authorName: string;
    note: string;
    createdAt: string;
};

export type ReferralCaseEventDto = {
    id: number;
    caseId: number;
    eventType:
    | "CASE_CREATED"
    | "NOTE_ADDED"
    | "CASE_CLOSED"
    | "CASE_REOPENED"
    | "TARGET_CHANGED";
    actorUserId: number;
    actorName: string;
    fromValue: string | null;
    toValue: string | null;
    note: string | null;
    createdAt: string;
};

export type ReferralCaseDetailDto = {
    case: ReferralCaseDto;
    notes: ReferralCaseNoteDto[];
    events: ReferralCaseEventDto[];
};

export type ReferralCasesListItemDto = ReferralCaseDto;