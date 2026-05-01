import type { ReferralCaseEventDto, ReferralCaseWorkflowDto, } from "@/shared/dtos/referrals/referral-workflow.dto";
import type { TrafficLight } from "@/shared/enums/traffic-light";


export type SupportCaseListItemDto = ReferralCaseWorkflowDto;

export type SupportCaseNoteDto = {
    id: number;
    caseId: number;
    authorUserId: number;
    authorName: string;
    note: string;
    createdAt: string;
};

export type SupportStudentSubjectDto = {
    courseId: number;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    teacherUserId: number;
    teacherName: string;
    riskStatus: TrafficLight | null;
    isIncomplete: boolean;
};

export type SupportStudentIncidentDto = {
    incidentId: number;
    typeCode: string;
    typeName: string;
    note: string;
    createdAt: string;
    createdByUserId: number;
    createdByName: string;
};

export type SupportStudentExpedientDto = {
    studentId: number;
    controlNumber: string;
    fullName: string;
    firstName: string;
    lastName: string;
    secondLastName: string | null;
    email: string | null;
    groupId: number;
    groupCode: string;
    groupName: string;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    subjects: SupportStudentSubjectDto[];
    incidents: SupportStudentIncidentDto[];
};

export type SupportCaseDetailDto = {
    caseItem: ReferralCaseWorkflowDto;
    expedient: SupportStudentExpedientDto;
    notes: SupportCaseNoteDto[];
    events: ReferralCaseEventDto[];
};