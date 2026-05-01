import type { AttendanceStatus } from "@/shared/enums/attendance";


export type AttendanceRecordDto = {
    id: number;
    courseId: number;
    studentId: number;
    date: string;
    status: AttendanceStatus;
    createdAt: string;
    updatedAt: string;
};

export type CourseAttendanceNonApplicableDayDto = {
    id: number;
    courseId: number;
    date: string;
    reason: string | null;
    createdByUserId: number;
    createdAt: string;
    updatedAt: string;
};

export type AttendanceWeeklySummaryDto = {
    studentId: number;
    absentCount: number;
    lateCount: number;
    presentCount: number;
    hasThreeConsecutiveAbsences: boolean;
};

export type AttendanceTodayResponseDto = {
    courseId: number;
    date: string;
    dayLabel: string;
    isBusinessDay: boolean;
    nonApplicableDay: CourseAttendanceNonApplicableDayDto | null;
    records: AttendanceRecordDto[];
    weeklySummary: AttendanceWeeklySummaryDto[];
};

export type SaveTodayAttendanceRequestDto = {
    records: Array<{
        studentId: number;
        status: AttendanceStatus;
    }>;
};

export type MarkTodayNonApplicableRequestDto = {
    reason?: string | null;
};