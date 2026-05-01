import type { AttendanceStatus } from "@/shared/enums/attendance";


export type AttendanceRecordLike = {
    studentId: number;
    date: string;
    status: AttendanceStatus;
};

export type BusinessWeekRange = {
    weekStartDate: string;
    weekEndDate: string;
};

export type StudentAttendanceWeeklySummary = {
    studentId: number;
    absentCount: number;
    lateCount: number;
    presentCount: number;
    hasThreeConsecutiveAbsences: boolean;
};

function pad2(value: number): string {
    return `${value}`.padStart(2, "0");
}

export function toISODateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());

    return `${year}-${month}-${day}`;
}

export function getTodayLocalISODate(): string {
    return toISODateLocal(new Date());
}

export function parseISODateAsLocalNoon(date: string): Date {
    return new Date(`${date}T12:00:00`);
}

export function isBusinessDay(date: string): boolean {
    const parsed = parseISODateAsLocalNoon(date);
    const day = parsed.getDay();

    return day >= 1 && day <= 5;
}

export function getSpanishDayLabel(date: string): string {
    const parsed = parseISODateAsLocalNoon(date);

    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(parsed);
}

export function getBusinessWeekRange(date: string): BusinessWeekRange {
    const parsed = parseISODateAsLocalNoon(date);
    const day = parsed.getDay();

    const mondayDiff = day === 0 ? -6 : 1 - day;

    const monday = new Date(parsed);
    monday.setDate(parsed.getDate() + mondayDiff);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return {
        weekStartDate: toISODateLocal(monday),
        weekEndDate: toISODateLocal(friday),
    };
}

function hasThreeConsecutiveAbsences(records: AttendanceRecordLike[]): boolean {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    let consecutiveAbsences = 0;

    for (const record of sorted) {
        if (record.status === "ABSENT") {
            consecutiveAbsences += 1;

            if (consecutiveAbsences >= 3) {
                return true;
            }

            continue;
        }

        if (record.status === "PRESENT" || record.status === "LATE") {
            consecutiveAbsences = 0;
        }
    }

    return false;
}

export function buildWeeklyAttendanceSummary(params: {
    studentIds: number[];
    records: AttendanceRecordLike[];
}): StudentAttendanceWeeklySummary[] {
    const recordsByStudentId = new Map<number, AttendanceRecordLike[]>();

    for (const record of params.records) {
        const current = recordsByStudentId.get(record.studentId) ?? [];
        current.push(record);
        recordsByStudentId.set(record.studentId, current);
    }

    return params.studentIds.map((studentId) => {
        const studentRecords = recordsByStudentId.get(studentId) ?? [];

        return {
            studentId,
            absentCount: studentRecords.filter(
                (record) => record.status === "ABSENT",
            ).length,
            lateCount: studentRecords.filter((record) => record.status === "LATE")
                .length,
            presentCount: studentRecords.filter(
                (record) => record.status === "PRESENT",
            ).length,
            hasThreeConsecutiveAbsences:
                hasThreeConsecutiveAbsences(studentRecords),
        };
    });
}