import { z } from "zod";


export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Debes escribir tu contraseña actual."),
        newPassword: z
            .string()
            .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
        confirmPassword: z
            .string()
            .min(1, "Debes confirmar la nueva contraseña."),
    })
    .superRefine((value, ctx) => {
        if (value.newPassword !== value.confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "La confirmación no coincide con la nueva contraseña.",
                path: ["confirmPassword"],
            });
        }

        if (value.currentPassword === value.newPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "La nueva contraseña debe ser diferente a la actual.",
                path: ["newPassword"],
            });
        }
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;