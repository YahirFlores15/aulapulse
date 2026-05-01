import { TutorServiceError } from "@/server/domains/tutor/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";


export async function requireTutorSession() {
    const auth = await requireRole(ROLE.TUTOR);

    if (!auth.ok) {
        return {
            ok: false as const,
            response: auth.response,
        };
    }

    return {
        ok: true as const,
        session: auth.session,
    };
}

export function parseIdParam(value: string, label = "id") {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
            { error: `El parámetro ${label} es inválido.` },
            { status: 400 },
        );
    }

    return parsed;
}

export function parseNumericParam(value: string, label = "id") {
    return parseIdParam(value, label);
}

export function parseTutorNumericId(value: string, label = "id") {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new TutorServiceError(`Parámetro inválido: ${label}.`, 400);
    }

    return parsed;
}

export function handleTutorError(error: unknown) {
    if (error instanceof TutorServiceError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status },
        );
    }

    console.error(error);

    return NextResponse.json(
        { error: "Error interno del servidor." },
        { status: 500 },
    );
}

export function handleTutorRouteError(error: unknown) {
    return handleTutorError(error);
}

export function redirectToAppPath(path: string) {
    return new NextResponse(null, {
        status: 303,
        headers: {
            Location: path,
        },
    });
}