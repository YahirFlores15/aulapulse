import type { GradeUnitDto } from "@/shared/dtos/teacher/grade-units.dto";


export type GradeEntryDto = {
    id: number;
    courseId: number;
    studentId: number;
    gradeUnitId: number;
    score: number;
    createdAt: string;
    updatedAt: string;
};

export type StudentUnitGradeDto = {
    studentId: number;
    gradeUnitId: number;
    score: number | null;
};

export type StudentFinalGradeDto = {
    studentId: number;
    finalScore: number | null;
    isComplete: boolean;
};

export type CourseGradesResponseDto = {
    courseId: number;
    units: GradeUnitDto[];
    entries: GradeEntryDto[];
    summary: StudentFinalGradeDto[];
};

export type CourseGradesByUnitResponseDto = {
    courseId: number;
    unitId: number;
    units: GradeUnitDto[];
    entries: GradeEntryDto[];
    summary: StudentFinalGradeDto[];
};