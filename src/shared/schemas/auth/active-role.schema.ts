import { roleSchema } from "@/shared/enums/roles";
import { z } from "zod";


export const activeRoleSchema = z.object({
    activeRole: roleSchema,
});

export type ActiveRoleInput = z.infer<typeof activeRoleSchema>;