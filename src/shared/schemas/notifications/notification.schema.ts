import { z } from "zod";


export const listNotificationsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    unreadOnly: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((value) => value === "true"),
});

export const notificationIdParamsSchema = z.object({
    notificationId: z.coerce.number().int().positive(
        "El id de la notificación debe ser un entero positivo.",
    ),
});

export const markNotificationReadSchema = z.object({
    redirectTo: z
        .string()
        .trim()
        .optional()
        .refine(
            (value) => value === undefined || value === "" || value.startsWith("/"),
            "redirectTo inválido.",
        ),
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type NotificationIdParamsInput = z.infer<typeof notificationIdParamsSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;