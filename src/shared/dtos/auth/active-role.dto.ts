import type { RoleCode } from "@/shared/enums/roles";


export type ActiveRoleChangeRequestDto = {
    activeRole: RoleCode;
};

export type ActiveRoleChangeResponseDto = {
    user: {
        id: number;
        email: string;
        roles: RoleCode[];
        activeRole: RoleCode;
        mustChangePassword: boolean;
    };
};