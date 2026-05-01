import { z } from "zod";


export const createGroupSchema = z.object({
    cycleId: z.coerce.number().int().positive("El ciclo es obligatorio"),
    code: z.string().trim().min(1, "El código es obligatorio").max(20, "Código demasiado largo"),
    name: z.string().trim().min(2, "El nombre es obligatorio").max(120, "Nombre demasiado largo"),
});

export const updateGroupSchema = z.object({
    code: z.string().trim().min(1, "El código es obligatorio").max(20, "Código demasiado largo").optional(),
    name: z.string().trim().min(2, "El nombre es obligatorio").max(120, "Nombre demasiado largo").optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;