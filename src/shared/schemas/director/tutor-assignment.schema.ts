import { z } from "zod";


export const assignTutorSchema = z.object({
    groupId: z.coerce.number().int().positive("El grupo es obligatorio"),
    tutorUserId: z.coerce.number().int().positive("El tutor es obligatorio"),
});

export type AssignTutorInput = z.infer<typeof assignTutorSchema>;