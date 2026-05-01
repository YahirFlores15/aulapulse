import { z } from "zod";


export const createStudentSchema = z.object({
    controlNumber: z.string().trim().min(3, "El número de control es obligatorio").max(30, "Número de control demasiado largo"),
    firstName: z.string().trim().min(2, "El nombre es obligatorio").max(80, "Nombre demasiado largo"),
    lastName: z.string().trim().min(2, "El apellido paterno es obligatorio").max(80, "Apellido demasiado largo"),
    secondLastName: z.string().trim().max(80, "Apellido demasiado largo").optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("Correo inválido").optional().or(z.literal("")),
    phone: z.string().trim().max(30, "Teléfono demasiado largo").optional().or(z.literal("")),
    groupId: z.coerce.number().int().positive("El grupo es obligatorio"),
});

export const updateStudentSchema = z.object({
    firstName: z.string().trim().min(2, "El nombre es obligatorio").max(80, "Nombre demasiado largo").optional(),
    lastName: z.string().trim().min(2, "El apellido paterno es obligatorio").max(80, "Apellido demasiado largo").optional(),
    secondLastName: z.string().trim().max(80, "Apellido demasiado largo").optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("Correo inválido").optional().or(z.literal("")),
    phone: z.string().trim().max(30, "Teléfono demasiado largo").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;