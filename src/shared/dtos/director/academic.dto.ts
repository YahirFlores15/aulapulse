export type AcademicCycleStatusDto = "UPCOMING" | "ACTIVE" | "CLOSED";

export type AcademicCycleOrdinalDto = 1 | 2 | 3;

export type CycleDto = {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
    ordinal: AcademicCycleOrdinalDto;
    status: AcademicCycleStatusDto;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type AcademicCycleDto = CycleDto;

export type CurrentAcademicCycleResponseDto = {
    currentCycle: AcademicCycleDto;
};

export type GroupDto = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

export type SubjectDto = {
    id: number;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

export type CourseDto = {
    id: number;
    cycleId: number;
    cycleCode: string;
    groupId: number;
    groupCode: string;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    teacherUserId: number;
    teacherName: string;
    teacherEmail: string;
    createdAt: string;
    updatedAt: string;
};

export type GroupTutorDto = {
    id: number;
    groupId: number;
    groupCode: string;
    groupName: string;
    tutorUserId: number;
    tutorName: string;
    tutorEmail: string;
    createdAt: string;
    updatedAt: string;
};