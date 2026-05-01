import type { IncidentStatusDto } from "@/shared/dtos/incidents/incidents.dto";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import type { TrafficLight } from "@/shared/enums/traffic-light";


export type ReferralCreatedFromRoleDto = "TEACHER" | "TUTOR";

export type ReferralAcademicContextTrafficLightDto = {
    color: TrafficLight | null;
    calculatedAt: string | null;
    redCausesCount: number;
    yellowCausesCount: number;
    causes: Array<{
        type: "ATTENDANCE" | "GRADE" | "INCIDENT";
        severity: "RED" | "YELLOW";
        message: string;
        courseId?: number;
        subjectId?: number | null;
        subjectCode?: string | null;
        subjectName?: string | null;
        incidentId?: number;
        value?: number | string | null;
        metadata?: Record<string, string | number | boolean | null>;
    }>;
};

export type ReferralAcademicContextCourseDto = {
    courseId: number;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    teacherUserId: number;
    teacherName: string;
    finalScore: number | null;
    gradeIsComplete: boolean;
    weeklyAttendance: {
        presentCount: number;
        absentCount: number;
        lateCount: number;
        hasThreeConsecutiveAbsences: boolean;
    };
};

export type ReferralAcademicContextIncidentDto = {
    incidentId: number;
    typeCode: string;
    typeName: string;
    status: IncidentStatusDto;
    note: string;
    createdAt: string;
    createdByName: string;
    courseId: number | null;
    subjectCode: string | null;
    subjectName: string | null;
};

export type ReferralAcademicContextDto = {
    generatedAt: string;
    student: {
        studentId: number;
        controlNumber: string;
        fullName: string;
    };
    group: {
        groupId: number;
        groupCode: string;
        groupName: string;
    };
    sourceIncident: ReferralAcademicContextIncidentDto;
    trafficLight: ReferralAcademicContextTrafficLightDto;
    courses: ReferralAcademicContextCourseDto[];
};

export type ReferralFromIncidentCaseDto = {
    caseId: number;
    incidentId: number;
    targetArea: ReferralTargetArea;
    status: "OPEN" | "CLOSED";
    reasonCode: string;
    reasonName: string;
    summary: string;
    createdFromRole: ReferralCreatedFromRoleDto | null;
    openedAt: string;
    linkByRole: {
        director: string;
        tutor: string;
        support: string;
    };
};

export type IncidentReferralLookupResponseDto = {
    incidentId: number;
    cases: ReferralFromIncidentCaseDto[];
};

export type CreateReferralFromIncidentRequestDto = {
    targetAreas: ReferralTargetArea[];
    reasonCode: string;
    summary: string;
};

export type CreateReferralFromIncidentResponseDto = {
    incidentId: number;
    createdCases: ReferralFromIncidentCaseDto[];
    existingCases: ReferralFromIncidentCaseDto[];
    academicContext: ReferralAcademicContextDto;
};