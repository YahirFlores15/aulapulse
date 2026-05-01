import type { RoleCode } from "@/shared/enums/roles";


export type SessionTokenPayload = {
    userId: number;
    email: string;
    roles: RoleCode[];
    activeRole: RoleCode;
    sessionVersion: number;
    issuedAt: number;
    expiresAt: number;
};

export type ValidatedSession = SessionTokenPayload & {
    isActive: true;
    mustChangePassword: boolean;
};

export type AuthUserSnapshot = {
    id: number;
    email: string;
    isActive: boolean;
    mustChangePassword: boolean;
    sessionVersion: number;
    roles: RoleCode[];
    lastActiveRole: RoleCode | null;
};