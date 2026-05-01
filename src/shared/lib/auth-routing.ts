import { ROLE, type RoleCode } from "@/shared/enums/roles";


export const ROLE_PRIORITY: readonly RoleCode[] = [
    ROLE.DIRECTOR,
    ROLE.TEACHER,
    ROLE.TUTOR,
    ROLE.PEDAGOGIA,
    ROLE.PSICOLOGIA,
    ROLE.SUPERUSER,
] as const;

export const ROLE_LABELS: Record<RoleCode, string> = {
    [ROLE.SUPERUSER]: "Superusuario",
    [ROLE.DIRECTOR]: "Director",
    [ROLE.TEACHER]: "Docente",
    [ROLE.TUTOR]: "Tutor",
    [ROLE.PEDAGOGIA]: "Pedagogía",
    [ROLE.PSICOLOGIA]: "Psicología",
};

export const ROLE_BASE_PATHS: Record<RoleCode, string> = {
    [ROLE.SUPERUSER]: "/super",
    [ROLE.DIRECTOR]: "/director",
    [ROLE.TEACHER]: "/teacher",
    [ROLE.TUTOR]: "/tutor",
    [ROLE.PEDAGOGIA]: "/pedagogia",
    [ROLE.PSICOLOGIA]: "/psicologia",
};

export const ROLE_DASHBOARD_ROUTES: Record<RoleCode, string> = {
    [ROLE.SUPERUSER]: "/super/dashboard",
    [ROLE.DIRECTOR]: "/director/dashboard",
    [ROLE.TEACHER]: "/teacher/dashboard",
    [ROLE.TUTOR]: "/tutor/dashboard",
    [ROLE.PEDAGOGIA]: "/pedagogia/dashboard",
    [ROLE.PSICOLOGIA]: "/psicologia/dashboard",
};

export function getRoleLabel(role: RoleCode): string {
    return ROLE_LABELS[role];
}

export function getBasePathByRole(role: RoleCode): string {
    return ROLE_BASE_PATHS[role];
}

export function getDefaultRouteByRole(role: RoleCode): string {
    return ROLE_DASHBOARD_ROUTES[role];
}

export function getDashboardRouteByRole(role: RoleCode): string {
    return getDefaultRouteByRole(role);
}

export function isPathWithinRoleScope(pathname: string, role: RoleCode): boolean {
    const basePath = getBasePathByRole(role);

    return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function getRouteForRoleSwitch(
    pathname: string,
    nextRole: RoleCode,
): string {
    if (!pathname) {
        return getDefaultRouteByRole(nextRole);
    }

    if (isPathWithinRoleScope(pathname, nextRole)) {
        return pathname;
    }

    return getDefaultRouteByRole(nextRole);
}

export function resolvePreferredActiveRole(
    roles: readonly RoleCode[],
    lastActiveRole?: RoleCode | null,
): RoleCode | null {
    if (roles.length === 0) {
        return null;
    }

    if (lastActiveRole && roles.includes(lastActiveRole)) {
        return lastActiveRole;
    }

    for (const role of ROLE_PRIORITY) {
        if (roles.includes(role)) {
            return role;
        }
    }

    return roles[0] ?? null;
}

/**
 * Compatibilidad temporal para código que todavía resuelve por lista de roles.
 * Internamente usa la misma prioridad centralizada del modo activo.
 */
export function getDefaultRouteByRoles(roles: readonly RoleCode[]): string {
    const resolvedRole = resolvePreferredActiveRole(roles);

    if (!resolvedRole) {
        return "/";
    }

    return getDefaultRouteByRole(resolvedRole);
}