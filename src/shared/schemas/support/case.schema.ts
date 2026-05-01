import { caseStatusSchema } from "@/shared/enums/case-status";
import { z } from "zod";


export const supportCaseIdParamsSchema = z.object({
    caseId: z.coerce.number().int().positive("El id del caso debe ser un entero positivo"),
});

export const supportCasesQuerySchema = z.object({
    status: caseStatusSchema.optional(),
});

export const supportCaseSummarySchema = z.object({
    id: z.number().int().positive(),
    studentId: z.number().int().positive(),
    studentControlNumber: z.string().min(1),
    studentFullName: z.string().min(1),
    groupId: z.number().int().positive(),
    groupCode: z.string().min(1),
    groupName: z.string().min(1),
    reasonCode: z.string().min(1),
    reasonName: z.string().min(1),
    status: caseStatusSchema,
    summary: z.string().min(1),
    sharedWithSupport: z.boolean(),
    openedAt: z.string().min(1),
    closedAt: z.string().nullable(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

export const supportCaseListSchema = z.object({
    cases: z.array(supportCaseSummarySchema),
});

export type SupportCaseIdParams = z.infer<typeof supportCaseIdParamsSchema>;
export type SupportCasesQuery = z.infer<typeof supportCasesQuerySchema>;
export type SupportCaseSummary = z.infer<typeof supportCaseSummarySchema>;
export type SupportCaseList = z.infer<typeof supportCaseListSchema>;