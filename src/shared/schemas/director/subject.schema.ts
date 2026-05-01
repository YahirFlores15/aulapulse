import { z } from "zod";


export const createSubjectSchema = z.object({
    code: z.string().trim().min(2, "El código es obligatorio").max(30, "Código demasiado largo"),
    name: z.string().trim().min(3, "El nombre es obligatorio").max(120, "Nombre demasiado largo"),
});

export const updateSubjectSchema = z.object({
    code: z.string().trim().min(2, "El código es obligatorio").max(30, "Código demasiado largo").optional(),
    name: z.string().trim().min(3, "El nombre es obligatorio").max(120, "Nombre demasiado largo").optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;