import type { StudentTrafficLightCauseDto } from "@/shared/dtos/risk/student-traffic-light.dto";
import type { TrafficLight } from "@/shared/enums/traffic-light";


export type StudentDto = {
    id: number;
    controlNumber: string;
    firstName: string;
    lastName: string;
    secondLastName: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    trafficLight: TrafficLight | null;
    trafficLightCauses: StudentTrafficLightCauseDto[];
    trafficLightCalculatedAt: string | null;
    redCausesCount: number;
    yellowCausesCount: number;
    createdAt: string;
    updatedAt: string;
};

export type GroupStudentDto = {
    id: number;
    cycleId: number;
    cycleCode: string;
    groupId: number;
    groupCode: string;
    studentId: number;
    controlNumber: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    trafficLight: TrafficLight | null;
    trafficLightCauses: StudentTrafficLightCauseDto[];
    trafficLightCalculatedAt: string | null;
    redCausesCount: number;
    yellowCausesCount: number;
    assignedAt: string;
};

export type StudentTrafficLightFilterDto = "GREEN" | "YELLOW" | "RED" | "NONE";

export type StudentImportRowDto = {
    rowNumber: number;
    controlNumber: string;
    firstName: string;
    lastName: string;
    secondLastName: string | null;
    email: string | null;
    phone: string | null;
};

export type StudentImportErrorDto = {
    rowNumber: number;
    field:
    | "controlNumber"
    | "firstName"
    | "lastName"
    | "secondLastName"
    | "email"
    | "phone"
    | "header"
    | "row";
    message: string;
};

export type StudentImportDuplicateDto = {
    rowNumber: number;
    controlNumber: string;
    reason: "DUPLICATE_IN_FILE" | "DUPLICATE_IN_DATABASE";
    message: string;
};

export type StudentImportCreatedStudentDto = {
    rowNumber: number;
    studentId: number;
    controlNumber: string;
};

export type StudentImportResultDto = {
    groupId: number;
    groupCode: string;
    groupName: string;
    cycleId: number;
    totalRows: number;
    createdStudents: number;
    assignedStudents: number;
    duplicateStudents: number;
    failedRows: number;
    importedStudents: StudentImportCreatedStudentDto[];
    duplicates: StudentImportDuplicateDto[];
    errors: StudentImportErrorDto[];
};