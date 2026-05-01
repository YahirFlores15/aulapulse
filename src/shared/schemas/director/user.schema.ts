import { ROLE } from "@/shared/enums/roles";
import { z } from "zod";


const operationalRoleValues = [
    ROLE.TEACHER,
    ROLE.PEDAGOGIA,
    ROLE.PSICOLOGIA,
] as const;

export const operationalRoleSchema = z.enum(operationalRoleValues, {
    error: "Rol operativo inválido",
});

export const createUserSchema = z.object({
    firstName: z.string().trim().min(2, "El nombre es obligatorio"),
    lastName: z.string().trim().min(2, "El apellido es obligatorio"),
    email: z.string().trim().toLowerCase().email("Correo inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    role: operationalRoleSchema,
    mustChangePassword: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
    firstName: z.string().trim().min(2, "El nombre es obligatorio").optional(),
    lastName: z.string().trim().min(2, "El apellido es obligatorio").optional(),
    email: z.string().trim().toLowerCase().email("Correo inválido").optional(),
    isActive: z.boolean().optional(),
    mustChangePassword: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type OperationalRole = z.infer<typeof operationalRoleSchema>;