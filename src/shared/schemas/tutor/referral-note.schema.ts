import { z } from "zod";


export const createReferralNoteSchema = z.object({
    note: z.string().trim().min(3).max(2000),
});

export type CreateReferralNoteInput = z.infer<typeof createReferralNoteSchema>;