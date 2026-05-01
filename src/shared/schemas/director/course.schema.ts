import { z } from "zod";


export const createCourseSchema = z.object({
    groupId: z.coerce.number().int().positive("El grupo es obligatorio"),
    subjectId: z.coerce.number().int().positive("La materia es obligatoria"),
    teacherUserId: z.coerce.number().int().positive("El docente es obligatorio"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;