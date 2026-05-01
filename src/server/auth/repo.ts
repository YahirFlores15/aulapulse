import { execute, query, queryOne } from "@/server/db/queries";
import type { RoleCode } from "@/shared/enums/roles";
import { roleSchema } from "@/shared/enums/roles";

import type { AuthUserSnapshot } from "./types";


type AuthUserRow = {
    id: number;
    email: string;
    is_active: number;
    must_change_password: number;
    session_version: number;
    last_active_role: string | null;
};

type AuthUserPasswordRow = {
    id: number;
    password_hash: string;
    is_active: number;
    must_change_password: number;
    session_version: number;
    last_active_role: string | null;
};

type RoleRow = {
    code: string;
};

function parseRoleOrNull(value: string | null): RoleCode | null {
    if (!value) {
        return null;
    }

    const parsed = roleSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

export function findAuthUserById(userId: number): AuthUserRow | null {
    return queryOne<AuthUserRow>(
        `
        SELECT
            u.id,
            u.email,
            u.is_active,
            u.must_change_password,
            u.session_version,
            u.last_active_role
        FROM users u
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId],
    );
}

export function findAuthUserPasswordById(userId: number): AuthUserPasswordRow | null {
    return queryOne<AuthUserPasswordRow>(
        `
        SELECT
            u.id,
            u.password_hash,
            u.is_active,
            u.must_change_password,
            u.session_version,
            u.last_active_role
        FROM users u
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId],
    );
}

export function listUserRoleCodes(userId: number): RoleCode[] {
    const rows = query<RoleRow>(
        `
        SELECT r.code
        FROM user_roles ur
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE ur.user_id = ?
        ORDER BY r.code ASC
        `,
        [userId],
    );

    return rows
        .map((row) => roleSchema.safeParse(row.code))
        .filter((result) => result.success)
        .map((result) => result.data);
}

export function getAuthUserSnapshot(userId: number): AuthUserSnapshot | null {
    const user = findAuthUserById(userId);

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        isActive: user.is_active === 1,
        mustChangePassword: user.must_change_password === 1,
        sessionVersion: user.session_version,
        roles: listUserRoleCodes(userId),
        lastActiveRole: parseRoleOrNull(user.last_active_role),
    };
}

export function setUserLastActiveRole(userId: number, activeRole: RoleCode): void {
    execute(
        `
        UPDATE users
        SET
            last_active_role = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [activeRole, userId],
    );
}

export function clearUserLastActiveRole(userId: number): void {
    execute(
        `
        UPDATE users
        SET
            last_active_role = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [userId],
    );
}

export function incrementUserSessionVersion(userId: number): void {
    execute(
        `
        UPDATE users
        SET
            session_version = session_version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [userId],
    );
}

export function setUserPasswordAndInvalidateSessions(
    userId: number,
    passwordHash: string,
    mustChangePassword: boolean,
): void {
    execute(
        `
        UPDATE users
        SET
            password_hash = ?,
            must_change_password = ?,
            session_version = session_version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [passwordHash, mustChangePassword ? 1 : 0, userId],
    );
}

export function changeOwnPasswordAndClearMustChangePassword(
    userId: number,
    passwordHash: string,
): void {
    execute(
        `
        UPDATE users
        SET
            password_hash = ?,
            must_change_password = 0,
            session_version = session_version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [passwordHash, userId],
    );
}

export function setUserActiveStatusAndInvalidateSessions(
    userId: number,
    isActive: boolean,
): void {
    execute(
        `
        UPDATE users
        SET
            is_active = ?,
            session_version = session_version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [isActive ? 1 : 0, userId],
    );
}