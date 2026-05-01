import { changeOwnPasswordAndClearMustChangePassword, findAuthUserPasswordById, getAuthUserSnapshot, } from "@/server/auth/repo";
import type { ChangePasswordResponseDto } from "@/shared/dtos/auth/change-password.dto";
import { changePasswordSchema } from "@/shared/schemas/auth/change-password.schema";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { requireAuth } from "@/server/auth/guards";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const auth = await requireAuth();

        if (!auth.ok) {
            return auth.response;
        }

        const body = await request.json().catch(() => null);
        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const currentUser = findAuthUserPasswordById(auth.session.userId);

        if (!currentUser) {
            return NextResponse.json(
                { error: "Usuario no encontrado." },
                { status: 404 },
            );
        }

        if (currentUser.is_active !== 1) {
            return NextResponse.json(
                { error: "Usuario inactivo." },
                { status: 403 },
            );
        }

        const passwordOk = await verifyPassword(
            parsed.data.currentPassword,
            currentUser.password_hash,
        );

        if (!passwordOk) {
            return NextResponse.json(
                { error: "La contraseña actual es incorrecta." },
                { status: 400 },
            );
        }

        const newPasswordHash = await hashPassword(parsed.data.newPassword);

        changeOwnPasswordAndClearMustChangePassword(
            auth.session.userId,
            newPasswordHash,
        );

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
            activeRole: auth.session.activeRole,
            lastActiveRole: freshSnapshot.lastActiveRole,
            sessionVersion: freshSnapshot.sessionVersion,
        });

        const response: ChangePasswordResponseDto = {
            ok: true,
            message: "Contraseña actualizada correctamente.",
            user: {
                id: freshSnapshot.id,
                email: freshSnapshot.email,
                roles: freshSnapshot.roles,
                activeRole: auth.session.activeRole,
                mustChangePassword: freshSnapshot.mustChangePassword,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[AUTH_CHANGE_PASSWORD_ERROR]", error);

        return NextResponse.json(
            { error: "No se pudo actualizar la contraseña." },
            { status: 500 },
        );
    }
}