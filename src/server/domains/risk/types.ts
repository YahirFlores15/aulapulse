import type { StudentTrafficLightCauseDto, TrafficLightCauseSeverity, TrafficLightCauseType, } from "@/shared/dtos/risk/student-traffic-light.dto";
import type { TrafficLight } from "@/shared/enums/traffic-light";


export type CourseIdentityForRisk = {
    courseId: number;
    subjectId: number | null;
    subjectCode: string | null;
    subjectName: string | null;
};

export type GradeRiskInput = CourseIdentityForRisk & {
    finalScore: number | null;
    isComplete: boolean;
};

export type AttendanceRiskInput = CourseIdentityForRisk & {
    absentCountWeek: number;
    lateCountWeek: number;
    hasThreeConsecutiveAbsences: boolean;
};

export type IncidentRiskInput = {
    incidentId: number;
    status: "OPEN" | "CLOSED";
    typeCode: string;
    typeName: string | null;
    createdAt: string;
};

export type StudentTrafficLightCalculationInput = {
    studentId: number;
    grades: GradeRiskInput[];
    attendance: AttendanceRiskInput[];
    incidents: IncidentRiskInput[];
};

export type CalculatedStudentTrafficLight = {
    studentId: number;
    color: TrafficLight;
    causes: StudentTrafficLightCauseDto[];
    redCausesCount: number;
    yellowCausesCount: number;
};

export type BuildCauseInput = {
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