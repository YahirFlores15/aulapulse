import { z } from "zod";


export const ROLE = {
    SUPERUSER: "SUPERUSER",
    DIRECTOR: "DIRECTOR",
    TEACHER: "TEACHER",
    TUTOR: "TUTOR",
    PEDAGOGIA: "PEDAGOGIA",
    PSICOLOGIA: "PSICOLOGIA",
} as const;

export const ROLE_VALUES = [
    ROLE.SUPERUSER,
    ROLE.DIRECTOR,
    ROLE.TEACHER,
    ROLE.TUTOR,
    ROLE.PEDAGOGIA,
    ROLE.PSICOLOGIA,
] as const;

export const roleSchema = z.enum(ROLE_VALUES);

export type RoleCode = z.infer<typeof roleSchema>;