import type { TrafficLight } from "@/shared/enums/traffic-light";


export type TrafficLightCauseType = "ATTENDANCE" | "GRADE" | "INCIDENT";

export type TrafficLightCauseSeverity = "RED" | "YELLOW";

export type StudentTrafficLightCauseDto = {
    type: TrafficLightCauseType;
    severity: TrafficLightCauseSeverity;
    message: string;
    courseId?: number;
    subjectId?: number | null;
    subjectCode?: string | null;
    subjectName?: string | null;
    incidentId?: number;
    value?: number | string | null;
    metadata?: Record<string, string | number | boolean | null>;
};

export type StudentTrafficLightSnapshotDto = {
    id: number;
    studentId: number;
    color: TrafficLight;
    causes: StudentTrafficLightCauseDto[];
    redCausesCount: number;
    yellowCausesCount: number;
    calculatedAt: string;
    createdAt: string;
    updatedAt: string;
};

export type StudentTrafficLightListItemDto = {
    studentId: number;
    controlNumber: string;
    fullName: string;
    groupId: number | null;
    groupCode: string | null;
    groupName: string | null;
    cycleId: number | null;
    cycleCode: string | null;
    color: TrafficLight | null;
    causes: StudentTrafficLightCauseDto[];
    redCausesCount: number;
    yellowCausesCount: number;
    calculatedAt: string | null;
};

export type StudentTrafficLightListResponseDto = {
    items: StudentTrafficLightListItemDto[];
};

export type RecalculateStudentTrafficLightResponseDto = {
    snapshot: StudentTrafficLightSnapshotDto;
};

export type RecalculateStudentTrafficLightsResponseDto = {
    count: number;
    items: StudentTrafficLightSnapshotDto[];
};