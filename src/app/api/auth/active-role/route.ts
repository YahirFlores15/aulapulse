import type { ActiveRoleChangeResponseDto } from "@/shared/dtos/auth/active-role.dto";
import { getAuthUserSnapshot, setUserLastActiveRole } from "@/server/auth/repo";
import { activeRoleSchema } from "@/shared/schemas/auth/active-role.schema";
import { createSession } from "@/server/auth/session";
import { requireAuth } from "@/server/auth/guards";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

async function handleActiveRoleChange(request: Request) {
    try {
        const auth = await requireAuth();

        if (!auth.ok) {
            return auth.response;
        }

        const body = await request.json().catch(() => null);
        const parsed = activeRoleSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        if (!auth.session.roles.includes(parsed.data.activeRole)) {
            return NextResponse.json(
                {
                    error: "El usuario no tiene asignado el rol solicitado.",
                },
                { status: 403 },
            );
        }

        setUserLastActiveRole(auth.session.userId, parsed.data.activeRole);

        const freshSnapshot = getAuthUserSnapshot(auth.session.userId);

        if (!freshSnapshot) {
            return NextResponse.json(
                { error: "No se pudo reconstruir la sesión actualizada." },
                { status: 500 },
            );
        }

        await createSession({
            userId: freshSnapshot.id,
            email: freshSnapshot.email,
            roles: freshSnapshot.roles,
            activeRole: parsed.data.activeRole,
            lastActiveRole: freshSnapshot.lastActiveRole,
            sessionVersion: freshSnapshot.sessionVersion,
        });

        const response: ActiveRoleChangeResponseDto = {
            user: {
                id: freshSnapshot.id,
                email: freshSnapshot.email,
                roles: freshSnapshot.roles,
                activeRole: parsed.data.activeRole,
                mustChangePassword: freshSnapshot.mustChangePassword,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[AUTH_ACTIVE_ROLE_CHANGE_ERROR]", error);

        return NextResponse.json(
            { error: "No se pudo cambiar el modo activo." },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    return handleActiveRoleChange(request);
}

export async function PATCH(request: Request) {
    return handleActiveRoleChange(request);
}