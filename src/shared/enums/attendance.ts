import { z } from "zod";


export const ATTENDANCE_STATUS = {
    PRESENT: "PRESENT",
    ABSENT: "ABSENT",
    LATE: "LATE",
} as const;

export const ATTENDANCE_STATUS_VALUES = Object.values(ATTENDANCE_STATUS) as [
    (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS],
    ...(typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS][],
];

export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUS_VALUES);

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;