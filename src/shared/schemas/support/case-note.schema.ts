import { z } from "zod";


export const supportCaseNoteSchema = z.object({
    note: z
        .string()
        .trim()
        .min(5, "La nota debe tener al menos 5 caracteres")
        .max(2000, "La nota no puede exceder 2000 caracteres"),
});

export const supportCaseNoteItemSchema = z.object({
    id: z.number().int().positive(),
    caseId: z.number().int().positive(),
    authorUserId: z.number().int().positive(),
    authorName: z.string().min(1),
    note: z.string().min(1),
    createdAt: z.string().min(1),
});

export const supportCaseNotesListSchema = z.object({
    notes: z.array(supportCaseNoteItemSchema),
});

export type SupportCaseNoteInput = z.infer<typeof supportCaseNoteSchema>;
export type SupportCaseNoteItem = z.infer<typeof supportCaseNoteItemSchema>;
export type SupportCaseNotesList = z.infer<typeof supportCaseNotesListSchema>;