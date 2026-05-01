import { DirectorServiceError } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";


export async function requireDirectorSession() {
    const auth = await requireRole(ROLE.DIRECTOR);

    if (!auth.ok) {
        return auth.response;
    }

    return auth.session;
}

export function parseIdParam(value: string, label = "id") {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
            { error: `El parámetro ${label} es inválido` },
            { status: 400 },
        );
    }

    return parsed;
}

export function parseNumericId(value: string, label = "id") {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new DirectorServiceError(
            `${label.toUpperCase()}_INVALID`,
            `El parámetro ${label} es inválido`,
            400,
        );
    }

    return parsed;
}

export function handleDirectorError(error: unknown) {
    if (error instanceof DirectorServiceError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
                ...(error.details !== undefined ? { details: error.details } : {}),
            },
            { status: error.status },
        );
    }

    console.error(error);

    return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 },
    );
}

export function handleDirectorRouteError(error: unknown) {
    return handleDirectorError(error);
}