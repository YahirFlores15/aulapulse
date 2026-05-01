import { referralTargetAreaSchema } from "@/shared/enums/referral-target-area";
import { z } from "zod";


export const incidentReferralParamsSchema = z.object({
    incidentId: z.coerce
        .number()
        .int("El id de la incidencia debe ser un entero.")
        .positive("El id de la incidencia debe ser positivo."),
});

export const createReferralFromIncidentSchema = z.object({
    targetAreas: z
        .array(referralTargetAreaSchema)
        .min(1, "Debes seleccionar al menos un área destino.")
        .max(2, "Solo se puede canalizar a Pedagogía, Psicología o ambas.")
        .superRefine((areas, ctx) => {
            const uniqueAreas = new Set(areas);

            if (uniqueAreas.size !== areas.length) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "No puedes repetir el área destino.",
                });
            }
        }),
    reasonCode: z
        .string()
        .trim()
        .min(1, "Debes seleccionar un motivo de canalización.")
        .max(50, "El código del motivo no puede exceder 50 caracteres."),
    summary: z
        .string()
        .trim()
        .min(10, "El resumen debe tener al menos 10 caracteres.")
        .max(1000, "El resumen no puede exceder 1000 caracteres."),
});

export const incidentReferralLookupSchema = z.object({
    incidentId: z.number().int().positive(),
    cases: z.array(
        z.object({
            caseId: z.number().int().positive(),
            incidentId: z.number().int().positive(),
            targetArea: referralTargetAreaSchema,
            status: z.enum(["OPEN", "CLOSED"]),
            reasonCode: z.string().min(1),
            reasonName: z.string().min(1),
            summary: z.string().min(1),
            createdFromRole: z.enum(["TEACHER", "TUTOR"]).nullable(),
            openedAt: z.string().min(1),
            linkByRole: z.object({
                director: z.string().min(1),
                tutor: z.string().min(1),
                support: z.string().min(1),
            }),
        }),
    ),
});

export type IncidentReferralParamsInput = z.infer<
    typeof incidentReferralParamsSchema
>;

export type CreateReferralFromIncidentInput = z.infer<
    typeof createReferralFromIncidentSchema
>;