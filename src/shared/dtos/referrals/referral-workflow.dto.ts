import type { ReferralAcademicContextDto, ReferralCreatedFromRoleDto, } from "@/shared/dtos/referrals/incident-referral.dto";
import type { IncidentStatusDto } from "@/shared/dtos/incidents/incidents.dto";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import type { CaseStatus } from "@/shared/enums/case-status";


export type ReferralCaseActorDto = {
    userId: number;
    fullName: string;
    email?: string | null;
};

export type ReferralCaseEventType =
    | "CASE_CREATED"
    | "NOTE_ADDED"
    | "CASE_CLOSED"
    | "CASE_REOPENED"
    | "TARGET_CHANGED";

export type ReferralCaseEventDto = {
    id: number;
    caseId: number;
    eventType: ReferralCaseEventType;
    actorUserId: number;
    actorName: string;
    fromValue: string | null;
    toValue: string | null;
    note: string | null;
    createdAt: string;
};

export type ReferralCaseWorkflowDto = {
    id: number;
    studentId: number;
    studentControlNumber: string;
    studentFullName: string;
    groupId: number;
    groupCode: string;
    groupName: string;
    createdByUserId: number;
    createdByName: string;
    reasonCode: string;
    reasonName: string;
    status: CaseStatus;
    summary: string;
    targetArea: ReferralTargetArea;
    sharedWithSupport: boolean;
    openedAt: string;
    closedAt: string | null;
    closedByUserId: number | null;
    closedByName: string | null;
    reopenedAt: string | null;
    reopenedByUserId: number | null;
    reopenedByName: string | null;
    relatedTeacherUserId: number | null;
    relatedTeacherName: string | null;
    incidentId: number | null;
    incidentTypeCode: string | null;
    incidentTypeName: string | null;
    incidentStatus: IncidentStatusDto | null;
    academicContext: ReferralAcademicContextDto | null;
    createdFromRole: ReferralCreatedFromRoleDto | null;
    createdAt: string;
    updatedAt: string;
    lastStatusChangedAt: string;
};

export type ReferralCaseWorkflowDetailDto = {
    caseItem: ReferralCaseWorkflowDto;
    notes: Array<{
        id: number;
        caseId: number;
        authorUserId: number;
        authorName: string;
        note: string;
        createdAt: string;
    }>;
    events: ReferralCaseEventDto[];
};