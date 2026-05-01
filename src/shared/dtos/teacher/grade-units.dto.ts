export type GradeUnitDto = {
    id: number;
    courseId: number;
    name: string;
    sortOrder: number;
    weightPercentage: number;
    createdAt: string;
    updatedAt: string;
};

export type GradeUnitsResponseDto = {
    courseId: number;
    units: GradeUnitDto[];
};