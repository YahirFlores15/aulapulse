import { z } from "zod";


const scoreSchema = z
    .number()
    .min(0, "La calificación no puede ser menor a 0.")
    .max(100, "La calificación no puede ser mayor a 100.")
    .refine((value) => Number(value.toFixed(2)) === value, {
        message: "La calificación puede tener máximo 2 decimales.",
    });

export const gradeEntryInputSchema = z.object({
    studentId: z.coerce.number().int().positive(),
    score: z.coerce.number().pipe(scoreSchema),
});

export const saveGradeEntriesSchema = z
    .object({
        unitId: z.coerce.number().int().positive("La unidad es obligatoria."),
        records: z
            .array(gradeEntryInputSchema)
            .min(1, "Debes enviar al menos un registro de calificación."),
    })
    .superRefine((value, ctx) => {
        const seenStudentIds = new Set<number>();

        value.records.forEach((record, index) => {
            if (seenStudentIds.has(record.studentId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["records", index, "studentId"],
                    message: "No puedes repetir alumnos en la misma captura.",
                });
            }

            seenStudentIds.add(record.studentId);
        });
    });

export const courseGradesQuerySchema = z.object({
    unitId: z.coerce.number().int().positive().optional(),
});

export type GradeEntryInput = z.infer<typeof gradeEntryInputSchema>;
export type SaveGradeEntriesInput = z.infer<typeof saveGradeEntriesSchema>;
export type CourseGradesQueryInput = z.infer<typeof courseGradesQuerySchema>;