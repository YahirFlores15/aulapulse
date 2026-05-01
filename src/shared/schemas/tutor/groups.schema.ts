import { z } from "zod";


export const tutorGroupParamsSchema = z.object({
    groupId: z.coerce.number().int().positive(),
});

export type TutorGroupParamsInput = z.infer<typeof tutorGroupParamsSchema>;