import type { RoleCode } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { canOperateAs, hasAnyActiveRole, hasAnyAssignedRole, hasAssignedRole, } from "./authz";
import { getValidatedSession } from "./session";


export async function requireAuth() {
    const session = await getValidatedSession();

    if (!session) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
        };
    }

    return {
        ok: true as const,
        session,
    };
}

export async function requireAssignedRole(role: RoleCode) {
    const auth = await requireAuth();

    if (!auth.ok) {
        return auth;
    }

    if (!hasAssignedRole(auth.session, role)) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "Sin permisos" }, { status: 403 }),
        };
    }

    return auth;
}

export async function requireActiveRole(role: RoleCode) {
    const auth = await requireAuth();

    if (!auth.ok) {
        return auth;
    }

    if (!canOperateAs(auth.session, role)) {
        return {
            ok: false as const,
            response: NextResponse.json(
                {
                    error: "El modo activo no corresponde a este módulo",
                    activeRole: auth.session.activeRole,
                },
                { status: 403 },
            ),
        };
    }

    return auth;
}

export async function requireAnyAssignedRole(roles: readonly RoleCode[]) {
    const auth = await requireAuth();

    if (!auth.ok) {
        return auth;
    }

    if (!hasAnyAssignedRole(auth.session, roles)) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "Sin permisos" }, { status: 403 }),
        };
    }

    return auth;
}

export async function requireAnyActiveRole(roles: readonly RoleCode[]) {
    const auth = await requireAuth();

    if (!auth.ok) {
        return auth;
    }

    if (!hasAnyActiveRole(auth.session, roles)) {
        return {
            ok: false as const,
            response: NextResponse.json(
                {
                    error: "El modo activo no corresponde a este módulo",
                    activeRole: auth.session.activeRole,
                },
                { status: 403 },
            ),
        };
    }

    return auth;
}

/**
 * Compatibilidad temporal con el nombre anterior.
 * Desde multicuenta debe entenderse como validación por modo activo.
 */
export async function requireRole(role: RoleCode) {
    return requireActiveRole(role);
}

/**
 * Compatibilidad temporal con el nombre anterior.
 * Desde multicuenta debe entenderse como validación por modo activo.
 */
export async function requireAnyRole(roles: readonly RoleCode[]) {
    return requireAnyActiveRole(roles);
}