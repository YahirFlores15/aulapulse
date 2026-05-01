import { trafficLightSchema } from "@/shared/enums/traffic-light";
import { z } from "zod";


export const trafficLightCauseTypeSchema = z.enum([
    "ATTENDANCE",
    "GRADE",
    "INCIDENT",
]);

export const trafficLightCauseSeveritySchema = z.enum(["RED", "YELLOW"]);

export const studentTrafficLightCauseSchema = z.object({
    type: trafficLightCauseTypeSchema,
    severity: trafficLightCauseSeveritySchema,
    message: z.string().trim().min(1),
    courseId: z.number().int().positive().optional(),
    subjectId: z.number().int().positive().nullable().optional(),
    subjectCode: z.string().trim().min(1).nullable().optional(),
    subjectName: z.string().trim().min(1).nullable().optional(),
    incidentId: z.number().int().positive().optional(),
    value: z.union([z.number(), z.string(), z.null()]).optional(),
    metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
        .optional(),
});

export const studentTrafficLightSnapshotSchema = z.object({
    id: z.number().int().positive(),
    studentId: z.number().int().positive(),
    color: trafficLightSchema,
    causes: z.array(studentTrafficLightCauseSchema),
    redCausesCount: z.number().int().min(0),
    yellowCausesCount: z.number().int().min(0),
    calculatedAt: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().min(1),
});

export const studentTrafficLightFilterSchema = z.object({
    color: trafficLightSchema.optional(),
    groupId: z.coerce.number().int().positive().optional(),
    cycleId: z.coerce.number().int().positive().optional(),
    query: z.string().trim().max(120).optional(),
});

export const recalculateStudentTrafficLightSchema = z.object({
    studentId: z.coerce.number().int().positive(),
});

export const recalculateStudentTrafficLightsSchema = z.object({
    studentIds: z
        .array(z.coerce.number().int().positive())
        .min(1, "Debes enviar al menos un alumno.")
        .optional(),
});

export type StudentTrafficLightCauseInput = z.infer<
    typeof studentTrafficLightCauseSchema
>;

export type StudentTrafficLightFilterInput = z.infer<
    typeof studentTrafficLightFilterSchema
>;

export type RecalculateStudentTrafficLightInput = z.infer<
    typeof recalculateStudentTrafficLightSchema
>;

export type RecalculateStudentTrafficLightsInput = z.infer<
    typeof recalculateStudentTrafficLightsSchema
>;