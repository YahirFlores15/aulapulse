export type AcademicCycleOrdinal = 1 | 2 | 3;

export type AcademicCycleStatus = "UPCOMING" | "ACTIVE" | "CLOSED";

export type AcademicCycleDefinition = {
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
    ordinal: AcademicCycleOrdinal;
};

export type AcademicCycleDateInput = {
    startDate: string;
    endDate: string;
};

function padYear(year: number) {
    return String(year).padStart(4, "0");
}

function toISODateLocal(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseISODateAsLocalNoon(value: string) {
    const [yearRaw, monthRaw, dayRaw] = value.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);

    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getTodayISODate() {
    return toISODateLocal(new Date());
}

export function getAcademicCycleOrdinalForMonth(month: number): AcademicCycleOrdinal {
    if (month >= 1 && month <= 4) {
        return 1;
    }

    if (month >= 5 && month <= 8) {
        return 2;
    }

    return 3;
}

export function getAcademicCycleOrdinalForDate(date: Date): AcademicCycleOrdinal {
    return getAcademicCycleOrdinalForMonth(date.getMonth() + 1);
}

export function buildAcademicCycleDefinition(
    year: number,
    ordinal: AcademicCycleOrdinal,
): AcademicCycleDefinition {
    const normalizedYear = padYear(year);

    if (ordinal === 1) {
        return {
            code: `${normalizedYear}-1`,
            name: `Enero - Abril ${normalizedYear}`,
            startDate: `${normalizedYear}-01-01`,
            endDate: `${normalizedYear}-04-30`,
            year,
            ordinal,
        };
    }

    if (ordinal === 2) {
        return {
            code: `${normalizedYear}-2`,
            name: `Mayo - Agosto ${normalizedYear}`,
            startDate: `${normalizedYear}-05-01`,
            endDate: `${normalizedYear}-08-31`,
            year,
            ordinal,
        };
    }

    return {
        code: `${normalizedYear}-3`,
        name: `Septiembre - Diciembre ${normalizedYear}`,
        startDate: `${normalizedYear}-09-01`,
        endDate: `${normalizedYear}-12-31`,
        year,
        ordinal,
    };
}

export function buildAcademicCyclesForYear(year: number): AcademicCycleDefinition[] {
    return [
        buildAcademicCycleDefinition(year, 1),
        buildAcademicCycleDefinition(year, 2),
        buildAcademicCycleDefinition(year, 3),
    ];
}

export function getCurrentAcademicCycleDefinition(today = new Date()): AcademicCycleDefinition {
    const year = today.getFullYear();
    const ordinal = getAcademicCycleOrdinalForDate(today);

    return buildAcademicCycleDefinition(year, ordinal);
}

export function getAcademicCycleStatus(
    cycle: AcademicCycleDateInput,
    todayISODate = getTodayISODate(),
): AcademicCycleStatus {
    const today = parseISODateAsLocalNoon(todayISODate);
    const startDate = parseISODateAsLocalNoon(cycle.startDate);
    const endDate = parseISODateAsLocalNoon(cycle.endDate);

    if (today < startDate) {
        return "UPCOMING";
    }

    if (today > endDate) {
        return "CLOSED";
    }

    return "ACTIVE";
}