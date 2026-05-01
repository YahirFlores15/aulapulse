import { referralTargetAreaSchema } from "@/shared/enums/referral-target-area";
import { caseStatusSchema } from "@/shared/enums/case-status";
import { z } from "zod";


export const directorReferralCaseParamsSchema = z.object({
    caseId: z.coerce.number().int().positive("El id del caso debe ser un entero positivo."),
});

export const directorReferralFiltersSchema = z.object({
    status: caseStatusSchema.optional(),
    targetArea: referralTargetAreaSchema.optional(),
    groupId: z.coerce.number().int().positive().optional(),
    studentId: z.coerce.number().int().positive().optional(),
    incidentId: z.coerce.number().int().positive().optional(),
    createdByUserId: z.coerce.number().int().positive().optional(),
    relatedTeacherUserId: z.coerce.number().int().positive().optional(),
});

export const directorReferralNoteSchema = z.object({
    note: z
        .string()
        .trim()
        .min(3, "La nota debe tener al menos 3 caracteres.")
        .max(2000, "La nota no puede exceder 2000 caracteres."),
});

export const closeReferralCaseSchema = z.object({
    note: z
        .string()
        .trim()
        .max(1000, "La nota de cierre no puede exceder 1000 caracteres.")
        .optional()
        .or(z.literal("")),
});

export const reopenReferralCaseSchema = z.object({
    note: z
        .string()
        .trim()
        .min(5, "Debes escribir una justificación de reapertura de al menos 5 caracteres.")
        .max(1000, "La nota de reapertura no puede exceder 1000 caracteres."),
});

export const changeReferralTargetSchema = z.object({
    targetArea: referralTargetAreaSchema,
    note: z
        .string()
        .trim()
        .max(1000, "La nota de cambio de área no puede exceder 1000 caracteres.")
        .optional()
        .or(z.literal("")),
});

export type DirectorReferralCaseParamsInput = z.infer<
    typeof directorReferralCaseParamsSchema
>;

export type DirectorReferralFiltersInput = z.infer<
    typeof directorReferralFiltersSchema
>;

export type DirectorReferralNoteInput = z.infer<
    typeof directorReferralNoteSchema
>;

export type CloseReferralCaseInput = z.infer<typeof closeReferralCaseSchema>;

export type ReopenReferralCaseInput = z.infer<typeof reopenReferralCaseSchema>;

export type ChangeReferralTargetInput = z.infer<
    typeof changeReferralTargetSchema
>;