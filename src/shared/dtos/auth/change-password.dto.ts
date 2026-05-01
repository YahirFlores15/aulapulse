import type { RoleCode } from "@/shared/enums/roles";


export type ChangePasswordResponseDto = {
    ok: true;
    message: string;
    user: {
        id: number;
        email: string;
        roles: RoleCode[];
        activeRole: RoleCode;
        mustChangePassword: boolean;
    };
};