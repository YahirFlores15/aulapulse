import { getDefaultRouteByRole } from "@/shared/lib/auth-routing";
import type { RoleCode } from "@/shared/enums/roles";
import { redirect } from "next/navigation";

import { hasAnyActiveRole, hasActiveRole } from "./authz";
import type { ValidatedSession } from "./types";
import { getValidatedSession } from "./session";


type RequirePageAccessOptions = {
    loginPath?: string;
    forbiddenPath?: string;
    role?: RoleCode;
    roles?: readonly RoleCode[];
    allowMustChangePassword?: boolean;
};

export async function requirePageAccess(
    options: RequirePageAccessOptions = {},
): Promise<ValidatedSession> {
    const {
        loginPath = "/login",
        forbiddenPath,
        role,
        roles,
        allowMustChangePassword = false,
    } = options;

    const session = await getValidatedSession();

    if (!session) {
        redirect(loginPath);
    }

    if (!allowMustChangePassword && session.mustChangePassword) {
        redirect("/change-password");
    }

    const fallbackPath = forbiddenPath ?? getDefaultRouteByRole(session.activeRole);

    if (role && !hasActiveRole(session, role)) {
        redirect(fallbackPath);
    }

    if (roles && roles.length > 0 && !hasAnyActiveRole(session, roles)) {
        redirect(fallbackPath);
    }

    return session;
}

export async function requireRolePageAccess(
    role: RoleCode,
    options: Omit<RequirePageAccessOptions, "role" | "roles"> = {},
): Promise<ValidatedSession> {
    return requirePageAccess({
        ...options,
        role,
    });
}

export async function requireAnyRolePageAccess(
    roles: readonly RoleCode[],
    options: Omit<RequirePageAccessOptions, "role" | "roles"> = {},
): Promise<ValidatedSession> {
    return requirePageAccess({
        ...options,
        roles,
    });
}

export async function redirectAuthenticatedUserToDefaultRoute() {
    const session = await getValidatedSession();

    if (!session) {
        return;
    }

    if (session.mustChangePassword) {
        redirect("/change-password");
    }

    redirect(getDefaultRouteByRole(session.activeRole));
}