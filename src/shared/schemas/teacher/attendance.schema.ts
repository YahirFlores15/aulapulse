import { attendanceStatusSchema } from "@/shared/enums/attendance";
import { z } from "zod";


export const attendanceDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

export const attendanceRecordSchema = z.object({
    studentId: z.coerce.number().int().positive(),
    status: attendanceStatusSchema,
});

export const attendanceBatchUpsertSchema = z.object({
    records: z
        .array(attendanceRecordSchema)
        .min(1, "Debes enviar al menos un registro de asistencia."),
});

export const markTodayNonApplicableSchema = z.object({
    reason: z
        .string()
        .trim()
        .max(300, "El motivo no puede exceder 300 caracteres.")
        .optional()
        .nullable()
        .transform((value) => {
            if (!value) return null;
            const trimmed = value.trim();
            return trimmed.length === 0 ? null : trimmed;
        }),
});

/**
 * Compatibilidad temporal.
 * La asistencia ya no acepta fecha enviada por el frontend.
 * El backend calcula el día actual automáticamente.
 */
export const attendanceQuerySchema = z.object({});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type AttendanceBatchUpsertInput = z.infer<
    typeof attendanceBatchUpsertSchema
>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
export type MarkTodayNonApplicableInput = z.infer<
    typeof markTodayNonApplicableSchema
>;