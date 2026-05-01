type GradeUnitLike = {
    id: number;
    weightPercentage: number;
};

type GradeEntryLike = {
    gradeUnitId: number;
    score: number;
};

export type StudentGradeSummary = {
    studentId: number;
    finalScore: number | null;
    isComplete: boolean;
};

export function normalizeToTwoDecimals(value: number): number {
    return Number(value.toFixed(2));
}

export function validateGradeUnitsWeightSum(
    units: Array<{ weightPercentage: number }>,
): boolean {
    const total = units.reduce((sum, unit) => sum + unit.weightPercentage, 0);
    return normalizeToTwoDecimals(total) === 100;
}

export function calculateWeightedFinalScore(
    units: GradeUnitLike[],
    entries: GradeEntryLike[],
): { finalScore: number | null; isComplete: boolean } {
    if (units.length === 0) {
        return {
            finalScore: null,
            isComplete: false,
        };
    }

    const entryByUnitId = new Map<number, GradeEntryLike>();

    for (const entry of entries) {
        entryByUnitId.set(entry.gradeUnitId, entry);
    }

    let total = 0;

    for (const unit of units) {
        const entry = entryByUnitId.get(unit.id);

        if (!entry) {
            return {
                finalScore: null,
                isComplete: false,
            };
        }

        total += (entry.score * unit.weightPercentage) / 100;
    }

    return {
        finalScore: normalizeToTwoDecimals(total),
        isComplete: true,
    };
}

export function buildStudentGradeSummary(params: {
    studentIds: number[];
    units: GradeUnitLike[];
    entries: Array<GradeEntryLike & { studentId: number }>;
}): StudentGradeSummary[] {
    const entriesByStudentId = new Map<number, Array<GradeEntryLike>>();

    for (const entry of params.entries) {
        const current = entriesByStudentId.get(entry.studentId) ?? [];
        current.push({
            gradeUnitId: entry.gradeUnitId,
            score: entry.score,
        });
        entriesByStudentId.set(entry.studentId, current);
    }

    return params.studentIds.map((studentId) => {
        const studentEntries = entriesByStudentId.get(studentId) ?? [];
        const result = calculateWeightedFinalScore(params.units, studentEntries);

        return {
            studentId,
            finalScore: result.finalScore,
            isComplete: result.isComplete,
        };
    });
}