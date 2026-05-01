import type { RoleCode } from "@/shared/enums/roles";

import type { ValidatedSession } from "./types";


export function hasAssignedRole(session: ValidatedSession, role: RoleCode): boolean {
    return session.roles.includes(role);
}

export function hasAnyAssignedRole(
    session: ValidatedSession,
    roles: readonly RoleCode[],
): boolean {
    return roles.some((role) => session.roles.includes(role));
}

export function hasActiveRole(session: ValidatedSession, role: RoleCode): boolean {
    return session.activeRole === role;
}

export function hasAnyActiveRole(
    session: ValidatedSession,
    roles: readonly RoleCode[],
): boolean {
    return roles.includes(session.activeRole);
}

export function canOperateAs(session: ValidatedSession, role: RoleCode): boolean {
    return hasAssignedRole(session, role) && hasActiveRole(session, role);
}

/**
 * Compatibilidad temporal con imports previos.
 */
export const hasRole = canOperateAs;

/**
 * Compatibilidad temporal con imports previos.
 */
export const hasAnyRole = hasAnyActiveRole;