import type { SuperManagedRole } from "@/shared/schemas/super/admin-user.schema";
import { execute, query, queryOne, transaction } from "@/server/db/queries";


type ManagedUserRow = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: number;
    must_change_password: number;
    created_at: string;
    updated_at: string;
    role_code: SuperManagedRole;
};

type UserRow = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    password_hash: string;
    is_active: number;
    must_change_password: number;
    created_at: string;
    updated_at: string;
};

type RoleRow = {
    id: number;
    code: string;
};

type InsertUserResult = {
    lastInsertRowid: number | bigint;
    changes: number;
};

const MANAGED_ROLE_CODES: readonly SuperManagedRole[] = [
    "DIRECTOR",
    "PEDAGOGIA",
    "PSICOLOGIA",
];

function toSqlBoolean(value: boolean) {
    return value ? 1 : 0;
}

export async function listManagedUsers(): Promise<ManagedUserRow[]> {
    const placeholders = MANAGED_ROLE_CODES.map(() => "?").join(", ");

    return query<ManagedUserRow>(
        `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.must_change_password,
        u.created_at,
        u.updated_at,
        r.code AS role_code
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE r.code IN (${placeholders})
      ORDER BY r.code ASC, u.first_name ASC, u.last_name ASC, u.email ASC
    `,
        [...MANAGED_ROLE_CODES],
    );
}

export async function getManagedUserById(userId: number): Promise<ManagedUserRow | null> {
    const placeholders = MANAGED_ROLE_CODES.map(() => "?").join(", ");

    return queryOne<ManagedUserRow>(
        `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.must_change_password,
        u.created_at,
        u.updated_at,
        r.code AS role_code
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?
        AND r.code IN (${placeholders})
      LIMIT 1
    `,
        [userId, ...MANAGED_ROLE_CODES],
    );
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
    return queryOne<UserRow>(
        `
      SELECT
        id,
        email,
        first_name,
        last_name,
        password_hash,
        is_active,
        must_change_password,
        created_at,
        updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
        [email],
    );
}

export async function getRoleByCode(code: SuperManagedRole | "TEACHER"): Promise<RoleRow | null> {
    return queryOne<RoleRow>(
        `
      SELECT id, code
      FROM roles
      WHERE code = ?
      LIMIT 1
    `,
        [code],
    );
}

export async function countUsersByRoleCode(roleCode: SuperManagedRole): Promise<number> {
    const row = queryOne<{ total: number }>(
        `
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE r.code = ?
    `,
        [roleCode],
    );

    return row?.total ?? 0;
}

export async function countActiveUsersByRoleCode(roleCode: SuperManagedRole): Promise<number> {
    const row = queryOne<{ total: number }>(
        `
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE r.code = ?
        AND u.is_active = 1
    `,
        [roleCode],
    );

    return row?.total ?? 0;
}

export async function countOtherActiveUsersByRoleCode(
    roleCode: SuperManagedRole,
    excludedUserId: number,
): Promise<number> {
    const row = queryOne<{ total: number }>(
        `
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE r.code = ?
        AND u.is_active = 1
        AND u.id <> ?
    `,
        [roleCode, excludedUserId],
    );

    return row?.total ?? 0;
}

export async function createManagedUserRecord(input: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    roleCode: SuperManagedRole;
}): Promise<number> {
    const role = await getRoleByCode(input.roleCode);

    if (!role) {
        throw new Error(`Rol no encontrado: ${input.roleCode}`);
    }

    return transaction(() => {
        const insertUserResult = execute(
            `
          INSERT INTO users (
            email,
            first_name,
            last_name,
            password_hash,
            is_active,
            must_change_password
          )
          VALUES (?, ?, ?, ?, 1, 1)
        `,
            [
                input.email,
                input.firstName,
                input.lastName,
                input.passwordHash,
            ],
        ) as InsertUserResult;

        const insertedUserId = Number(insertUserResult.lastInsertRowid);

        execute(
            `
          INSERT INTO user_roles (user_id, role_id)
          VALUES (?, ?)
        `,
            [insertedUserId, role.id],
        );

        if (input.roleCode === "DIRECTOR") {
            const teacherRole = queryOne<RoleRow>(
                `
                SELECT id, code
                FROM roles
                WHERE code = 'TEACHER'
                LIMIT 1
                `,
            );

            if (!teacherRole) {
                throw new Error("Rol TEACHER no encontrado.");
            }

            execute(
                `
                INSERT OR IGNORE INTO user_roles (user_id, role_id)
                VALUES (?, ?)
                `,
                [insertedUserId, teacherRole.id],
            );
        }

        return insertedUserId;
    });
}

export async function updateManagedUserActiveStatus(userId: number, isActive: boolean): Promise<void> {
    await execute(
        `
      UPDATE users
      SET
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        [toSqlBoolean(isActive), userId],
    );
}

export async function updateManagedUserPassword(userId: number, passwordHash: string): Promise<void> {
    await execute(
        `
      UPDATE users
      SET
        password_hash = ?,
        must_change_password = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        [passwordHash, userId],
    );
}