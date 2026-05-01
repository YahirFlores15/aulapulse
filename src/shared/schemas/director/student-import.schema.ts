import { z } from "zod";


export const studentImportRowSchema = z.object({
    rowNumber: z.coerce.number().int().positive(),
    controlNumber: z.string().trim().max(30, "Número de control demasiado largo"),
    firstName: z.string().trim().max(80, "Nombre demasiado largo"),
    lastName: z.string().trim().max(80, "Apellido paterno demasiado largo"),
    secondLastName: z.string().trim().max(80, "Apellido materno demasiado largo").optional().default(""),
    email: z.string().trim().max(120, "Correo demasiado largo").optional().default(""),
    phone: z.string().trim().max(30, "Teléfono demasiado largo").optional().default(""),
});

export const importStudentsInputSchema = z.object({
    groupId: z.coerce.number().int().positive("El grupo es obligatorio"),
    rows: z
        .array(studentImportRowSchema)
        .min(1, "El archivo no contiene filas para importar")
        .max(1000, "El archivo excede el máximo permitido de 1000 filas"),
});

export type StudentImportRowInput = z.infer<typeof studentImportRowSchema>;
export type ImportStudentsInput = z.infer<typeof importStudentsInputSchema>;