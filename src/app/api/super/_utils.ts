import { SuperServiceError } from "@/server/domains/super/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

export async function requireSuperSession() {
    const auth = await requireRole(ROLE.SUPERUSER);

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

export function parseNumericId(value: string, label = "id") {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new SuperServiceError(`El parámetro ${label} es inválido.`, 400);
    }

    return parsed;
}

export function parseSuperUserId(value: string) {
    return parseNumericId(value, "userId");
}

export function handleSuperError(error: unknown) {
    if (error instanceof SuperServiceError) {
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

export function handleSuperRouteError(error: unknown) {
    return handleSuperError(error);
}