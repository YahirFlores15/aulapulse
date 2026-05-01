import { assignTutorSchema } from "@/shared/schemas/director/tutor-assignment.schema";
import { directorService } from "@/server/domains/director/service";
import { getAuthUserSnapshot } from "@/server/auth/repo";
import { createSession } from "@/server/auth/session";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError } from "../_utils";


export const runtime = "nodejs";

export async function GET() {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const groupTutors = await directorService.listGroupTutors();
        return NextResponse.json({ data: groupTutors });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function POST(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json().catch(() => null);
        const parsed = assignTutorSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const assignment = await directorService.assignTutor(parsed.data);

        /*
         * Si el Director se asigna a sí mismo como Tutor, el servicio actualiza
         * sus roles y aumenta session_version. Eso invalida la cookie actual.
         *
         * Para evitar que el usuario quede expulsado a mitad del flujo,
         * regeneramos la sesión con el snapshot actualizado.
         */
        if (auth.session.userId === parsed.data.tutorUserId) {
            const refreshedUser = getAuthUserSnapshot(auth.session.userId);

            if (refreshedUser && refreshedUser.isActive) {
                await createSession({
                    userId: refreshedUser.id,
                    email: refreshedUser.email,
                    roles: refreshedUser.roles,
                    activeRole: auth.session.activeRole,
                    lastActiveRole: refreshedUser.lastActiveRole,
                    sessionVersion: refreshedUser.sessionVersion,
                });
            }
        }

        return NextResponse.json({ data: assignment }, { status: 201 });
    } catch (error) {
        return handleDirectorError(error);
    }
}