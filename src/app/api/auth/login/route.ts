import { listUserRoleCodes, setUserLastActiveRole } from "@/server/auth/repo";
import { resolvePreferredActiveRole } from "@/shared/lib/auth-routing";
import type { LoginResponseDto } from "@/shared/dtos/auth/login.dto";
import { loginSchema } from "@/shared/schemas/auth/login.schema";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import type { RoleCode } from "@/shared/enums/roles";
import { roleSchema } from "@/shared/enums/roles";
import { queryOne } from "@/server/db/queries";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

type LoginUserRow = {
    id: number;
    email: string;
    password_hash: string;
    is_active: number;
    must_change_password: number;
    session_version: number;
    last_active_role: string | null;
};

function parseRoleOrNull(value: string | null): RoleCode | null {
    if (!value) {
        return null;
    }

    const parsed = roleSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    issues: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const email = parsed.data.email.trim().toLowerCase();

        const user = queryOne<LoginUserRow>(
            `
            SELECT
                id,
                email,
                password_hash,
                is_active,
                must_change_password,
                session_version,
                last_active_role
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email],
        );

        if (!user) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 },
            );
        }

        if (user.is_active !== 1) {
            return NextResponse.json(
                { error: "Usuario inactivo" },
                { status: 403 },
            );
        }

        const passwordOk = await verifyPassword(parsed.data.password, user.password_hash);

        if (!passwordOk) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 },
            );
        }

        const roles = listUserRoleCodes(user.id);

        if (roles.length === 0) {
            return NextResponse.json(
                { error: "El usuario no tiene roles asignados." },
                { status: 403 },
            );
        }

        const activeRole = resolvePreferredActiveRole(
            roles,
            parseRoleOrNull(user.last_active_role),
        );

        if (!activeRole) {
            return NextResponse.json(
                { error: "No se pudo resolver el modo activo." },
                { status: 500 },
            );
        }

        setUserLastActiveRole(user.id, activeRole);

        await createSession({
            userId: user.id,
            email: user.email,
            roles,
            activeRole,
            sessionVersion: user.session_version,
        });

        const response: LoginResponseDto = {
            user: {
                id: user.id,
                email: user.email,
                roles,
                activeRole,
                mustChangePassword: user.must_change_password === 1,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[AUTH_LOGIN_ERROR]", error);

        return NextResponse.json(
            { error: "No se pudo iniciar sesión" },
            { status: 500 },
        );
    }
}