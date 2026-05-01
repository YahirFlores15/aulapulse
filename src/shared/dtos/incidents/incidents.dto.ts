import type { RoleCode } from "@/shared/enums/roles";


export type IncidentStatusDto = "OPEN" | "CLOSED";

export type IncidentSourceRoleDto = Extract<
    RoleCode,
    "DIRECTOR" | "TEACHER" | "TUTOR"
>;

export type IncidentEventTypeDto =
    | "INCIDENT_CREATED"
    | "NOTE_ADDED"
    | "INCIDENT_CLOSED"
    | "INCIDENT_REOPENED";

export type IncidentTypeDto = {
    code: string;
    name: string;
    isActive: boolean;
};

export type IncidentNotificationStatusDto = {
    internalNotificationsCreated: number;
    emailAttempted: boolean;
    emailSent: boolean;
    emailError: string | null;
};

export type IncidentListItemDto = {
    id: number;
    studentId: number;
    studentControlNumber: string;
    studentFullName: string;
    typeCode: string;
    typeName: string;
    note: string;
    status: IncidentStatusDto;
    courseId: number | null;
    subjectId: number | null;
    subjectCode: string | null;
    subjectName: string | null;
    groupId: number | null;
    groupCode: string | null;
    groupName: string | null;
    createdByUserId: number;
    createdByName: string;
    sourceRole: IncidentSourceRoleDto | null;
    createdAt: string;
    updatedAt: string | null;
    closedAt: string | null;
    closedByUserId: number | null;
    closedByName: string | null;
    reopenedAt: string | null;
    reopenedByUserId: number | null;
    reopenedByName: string | null;
    lastStatusChangedAt: string | null;
};

export type IncidentNoteDto = {
    id: number;
    incidentId: number;
    authorUserId: number;
    authorName: string;
    note: string;
    createdAt: string;
};

export type IncidentEventDto = {
    id: number;
    incidentId: number;
    eventType: IncidentEventTypeDto;
    actorUserId: number;
    actorName: string;
    fromValue: string | null;
    toValue: string | null;
    note: string | null;
    createdAt: string;
};

export type IncidentDetailDto = {
    incident: IncidentListItemDto;
    notes: IncidentNoteDto[];
    events: IncidentEventDto[];
};

export type IncidentListResponseDto = {
    items: IncidentListItemDto[];
};

export type CreateIncidentRequestDto = {
    studentId: number;
    typeCode: string;
    note: string;
    courseId?: number | null;
    groupId?: number | null;
};

export type CreateIncidentResponseDto = {
    incident: IncidentListItemDto;
    notificationStatus: IncidentNotificationStatusDto;
};

export type AddIncidentNoteRequestDto = {
    note: string;
};

export type AddIncidentNoteResponseDto = {
    detail: IncidentDetailDto;
    notificationStatus: IncidentNotificationStatusDto;
};

export type CloseIncidentRequestDto = {
    reason?: string | null;
};

export type CloseIncidentResponseDto = {
    detail: IncidentDetailDto;
    notificationStatus: IncidentNotificationStatusDto;
};

export type ReopenIncidentRequestDto = {
    reason?: string | null;
};

export type ReopenIncidentResponseDto = {
    detail: IncidentDetailDto;
    notificationStatus: IncidentNotificationStatusDto;
};

export type IncidentListQueryDto = {
    status?: IncidentStatusDto | "ALL";
    studentId?: number;
    courseId?: number;
    groupId?: number;
};