import { countActiveUsersByRoleCode, countOtherActiveUsersByRoleCode, createManagedUserRecord, getManagedUserById, getRoleByCode, getUserByEmail, listManagedUsers, } from "@/server/domains/super/repo";
import type { CreateAdminUserInput, SuperManagedRole, UpdateAdminUserStatusInput, } from "@/shared/schemas/super/admin-user.schema";
import { setUserActiveStatusAndInvalidateSessions, setUserPasswordAndInvalidateSessions, } from "@/server/auth/repo";
import type { ResetManagedUserPasswordInput } from "@/shared/schemas/super/password-reset.schema";
import type { SuperUserDetailDto, SuperUserListItemDto } from "@/shared/dtos/super/super.dto";
import { hashPassword } from "@/server/auth/password";


const MANAGED_ROLE_CODES: readonly SuperManagedRole[] = [
    "DIRECTOR",
    "PEDAGOGIA",
    "PSICOLOGIA",
];

function buildFullName(parts: Array<string | null | undefined>): string {
    return parts
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter((part) => part.length > 0)
        .join(" ");
}

function isManagedRole(role: string): role is SuperManagedRole {
    return MANAGED_ROLE_CODES.includes(role as SuperManagedRole);
}

function mapManagedUserListItem(row: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: number;
    must_change_password: number;
    created_at: string;
    role_code: string;
}): SuperUserListItemDto {
    if (!isManagedRole(row.role_code)) {
        throw new Error(`Rol administrable inválido: ${row.role_code}`);
    }

    return {
        id: row.id,
        email: row.email,
        fullName: buildFullName([row.first_name, row.last_name]),
        role: row.role_code,
        isActive: row.is_active === 1,
        mustChangePassword: row.must_change_password === 1,
        createdAt: row.created_at,
    };
}

function mapManagedUserDetail(row: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: number;
    must_change_password: number;
    created_at: string;
    updated_at: string;
    role_code: string;
}): SuperUserDetailDto {
    if (!isManagedRole(row.role_code)) {
        throw new Error(`Rol administrable inválido: ${row.role_code}`);
    }

    return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: buildFullName([row.first_name, row.last_name]),
        role: row.role_code,
        isActive: row.is_active === 1,
        mustChangePassword: row.must_change_password === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class SuperServiceError extends Error {
    readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "SuperServiceError";
        this.status = status;
    }
}

async function assertCanCreateActiveDirector(): Promise<void> {
    const activeDirectorCount = await countActiveUsersByRoleCode("DIRECTOR");

    if (activeDirectorCount > 0) {
        throw new SuperServiceError(
            "Ya existe un Director activo. Desactiva al Director actual antes de crear otro.",
            409,
        );
    }
}

async function assertCanActivateDirector(userId: number): Promise<void> {
    const otherActiveDirectorCount = await countOtherActiveUsersByRoleCode(
        "DIRECTOR",
        userId,
    );

    if (otherActiveDirectorCount > 0) {
        throw new SuperServiceError(
            "No puedes activar este Director porque ya existe otro Director activo.",
            409,
        );
    }
}

export async function listSuperManagedUsers(): Promise<SuperUserListItemDto[]> {
    const rows = await listManagedUsers();
    return rows.map(mapManagedUserListItem);
}

export async function getSuperManagedUser(userId: number): Promise<SuperUserDetailDto> {
    const user = await getManagedUserById(userId);

    if (!user) {
        throw new SuperServiceError("Usuario no encontrado.", 404);
    }

    return mapManagedUserDetail(user);
}

export async function createSuperManagedUser(
    input: CreateAdminUserInput,
): Promise<SuperUserDetailDto> {
    const role = await getRoleByCode(input.role);

    if (!role) {
        throw new SuperServiceError("El rol solicitado no existe.", 400);
    }

    if (!isManagedRole(input.role)) {
        throw new SuperServiceError(
            "Solo se pueden crear cuentas DIRECTOR, PEDAGOGIA o PSICOLOGIA.",
            400,
        );
    }

    if (input.role === "DIRECTOR") {
        await assertCanCreateActiveDirector();
    }

    const existingUser = await getUserByEmail(input.email);

    if (existingUser) {
        throw new SuperServiceError("Ya existe un usuario con ese correo.", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const createdUserId = await createManagedUserRecord({
        email: input.email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
        roleCode: input.role,
    });

    return getSuperManagedUser(createdUserId);
}

export async function setSuperManagedUserActiveStatus(
    userId: number,
    input: UpdateAdminUserStatusInput,
): Promise<SuperUserDetailDto> {
    const existingUser = await getManagedUserById(userId);

    if (!existingUser) {
        throw new SuperServiceError("Usuario no encontrado.", 404);
    }

    if (existingUser.role_code === "DIRECTOR" && input.isActive) {
        await assertCanActivateDirector(userId);
    }

    setUserActiveStatusAndInvalidateSessions(userId, input.isActive);

    return getSuperManagedUser(userId);
}

export async function resetSuperManagedUserPassword(
    userId: number,
    input: ResetManagedUserPasswordInput,
): Promise<SuperUserDetailDto> {
    const existingUser = await getManagedUserById(userId);

    if (!existingUser) {
        throw new SuperServiceError("Usuario no encontrado.", 404);
    }

    const passwordHash = await hashPassword(input.newPassword);

    setUserPasswordAndInvalidateSessions(userId, passwordHash, true);

    return getSuperManagedUser(userId);
}