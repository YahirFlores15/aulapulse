import type { RoleCode } from "@/shared/enums/roles";


export type LoginResponseDto = {
    user: {
        id: number;
        email: string;
        roles: RoleCode[];
        activeRole: RoleCode;
        mustChangePassword: boolean;
    };
};