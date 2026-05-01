import { z } from "zod";


export const CASE_STATUS = {
    OPEN: "OPEN",
    CLOSED: "CLOSED",
} as const;

export const CASE_STATUS_VALUES = [
    CASE_STATUS.OPEN,
    CASE_STATUS.CLOSED,
] as const;

export const caseStatusSchema = z.enum(CASE_STATUS_VALUES);

export type CaseStatus = z.infer<typeof caseStatusSchema>;