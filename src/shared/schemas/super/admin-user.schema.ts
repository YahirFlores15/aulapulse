import { z } from "zod";


export const SUPER_MANAGED_ROLE_VALUES = [
    "DIRECTOR",
    "PEDAGOGIA",
    "PSICOLOGIA",
] as const;

export const superManagedRoleSchema = z.enum(SUPER_MANAGED_ROLE_VALUES);

const baseNameSchema = z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio.")
    .max(100, "Máximo 100 caracteres.");

export const createAdminUserSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "El correo es obligatorio.")
        .email("Correo inválido.")
        .max(255, "Máximo 255 caracteres.")
        .transform((value) => value.toLowerCase()),
    firstName: baseNameSchema,
    lastName: baseNameSchema,
    role: superManagedRoleSchema,
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres.")
        .max(128, "La contraseña no puede exceder 128 caracteres."),
});

export const adminUserIdParamsSchema = z.object({
    userId: z.coerce.number().int("El id de usuario debe ser entero.").positive("El id de usuario debe ser mayor a cero."),
});

export const updateAdminUserStatusSchema = z.object({
    isActive: z.boolean(),
});

export type SuperManagedRole = z.infer<typeof superManagedRoleSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type AdminUserIdParams = z.infer<typeof adminUserIdParamsSchema>;
export type UpdateAdminUserStatusInput = z.infer<typeof updateAdminUserStatusSchema>;