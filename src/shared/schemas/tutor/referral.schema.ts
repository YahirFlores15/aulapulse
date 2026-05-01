import { referralTargetAreaSchema } from "@/shared/enums/referral-target-area";
import { z } from "zod";


export const referralCaseParamsSchema = z.object({
    caseId: z.coerce.number().int().positive(),
});

export const createReferralSchema = z.object({
    studentId: z.number().int().positive(),
    groupId: z.number().int().positive(),
    reasonCode: z.string().trim().min(1).max(50),
    summary: z.string().trim().min(10).max(1000),
    targetArea: referralTargetAreaSchema,
    sharedWithSupport: z.boolean().default(true),
});

export const updateReferralSummarySchema = z.object({
    summary: z.string().trim().min(10).max(1000),
});

export type ReferralCaseParamsInput = z.infer<typeof referralCaseParamsSchema>;
export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type UpdateReferralSummaryInput = z.infer<typeof updateReferralSummarySchema>;