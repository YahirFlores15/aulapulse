import { z } from "zod";


export const resetManagedUserPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
        .max(128, "La nueva contraseña no puede exceder 128 caracteres."),
});

export type ResetManagedUserPasswordInput = z.infer<typeof resetManagedUserPasswordSchema>;