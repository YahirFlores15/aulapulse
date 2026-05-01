import type { RoleCode } from "@/shared/enums/roles";


export type AuthSessionUserDto = {
    id: number;
    email: string;
    roles: RoleCode[];
    activeRole: RoleCode;
    mustChangePassword: boolean;
    sessionVersion?: number;
    issuedAt?: number;
    expiresAt?: number;
};

export type AuthSessionResponseDto = {
    user: AuthSessionUserDto | null;
};