import { z } from "zod";


export const incidentStatusSchema = z.enum(["OPEN", "CLOSED"]);

export const incidentSourceRoleSchema = z.enum([
    "DIRECTOR",
    "TEACHER",
    "TUTOR",
]);

export const incidentEventTypeSchema = z.enum([
    "INCIDENT_CREATED",
    "NOTE_ADDED",
    "INCIDENT_CLOSED",
    "INCIDENT_REOPENED",
]);

export const incidentTypeCodeSchema = z
    .string()
    .trim()
    .min(1, "El tipo de incidencia es obligatorio.")
    .max(50, "El tipo de incidencia no puede exceder 50 caracteres.");

export const incidentNoteSchema = z
    .string()
    .trim()
    .min(5, "La nota debe tener al menos 5 caracteres.")
    .max(1000, "La nota no puede exceder 1000 caracteres.");

export const incidentStatusChangeReasonSchema = z
    .string()
    .trim()
    .max(500, "El motivo no puede exceder 500 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => {
        if (value === undefined) {
            return null;
        }

        const trimmed = value.trim();

        return trimmed.length === 0 ? null : trimmed;
    });

export const createIncidentSchema = z.object({
    studentId: z.coerce
        .number()
        .int("El alumno debe ser un número entero.")
        .positive("El alumno es obligatorio."),
    typeCode: incidentTypeCodeSchema,
    note: incidentNoteSchema,
    courseId: z.coerce
        .number()
        .int("El curso debe ser un número entero.")
        .positive("El curso debe ser válido.")
        .nullable()
        .optional(),
    groupId: z.coerce
        .number()
        .int("El grupo debe ser un número entero.")
        .positive("El grupo debe ser válido.")
        .nullable()
        .optional(),
});

export const addIncidentNoteSchema = z.object({
    note: incidentNoteSchema,
});

export const closeIncidentSchema = z.object({
    reason: incidentStatusChangeReasonSchema,
});

export const reopenIncidentSchema = z.object({
    reason: incidentStatusChangeReasonSchema,
});

export const incidentIdParamsSchema = z.object({
    incidentId: z.coerce
        .number()
        .int("El id de la incidencia debe ser un entero.")
        .positive("El id de la incidencia debe ser válido."),
});

export const studentIncidentsParamsSchema = z.object({
    studentId: z.coerce
        .number()
        .int("El id del alumno debe ser un entero.")
        .positive("El id del alumno debe ser válido."),
});

export const tutorGroupIncidentsParamsSchema = z.object({
    groupId: z.coerce
        .number()
        .int("El id del grupo debe ser un entero.")
        .positive("El id del grupo debe ser válido."),
});

export const incidentListQuerySchema = z.object({
    status: z
        .union([incidentStatusSchema, z.literal("ALL")])
        .optional()
        .default("ALL"),
    studentId: z.coerce.number().int().positive().optional(),
    courseId: z.coerce.number().int().positive().optional(),
    groupId: z.coerce.number().int().positive().optional(),
});

export type IncidentStatusInput = z.infer<typeof incidentStatusSchema>;
export type IncidentSourceRoleInput = z.infer<typeof incidentSourceRoleSchema>;
export type IncidentEventTypeInput = z.infer<typeof incidentEventTypeSchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type AddIncidentNoteInput = z.infer<typeof addIncidentNoteSchema>;
export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>;
export type ReopenIncidentInput = z.infer<typeof reopenIncidentSchema>;
export type IncidentIdParamsInput = z.infer<typeof incidentIdParamsSchema>;
export type StudentIncidentsParamsInput = z.infer<typeof studentIncidentsParamsSchema>;
export type TutorGroupIncidentsParamsInput = z.infer<typeof tutorGroupIncidentsParamsSchema>;
export type IncidentListQueryInput = z.infer<typeof incidentListQuerySchema>;