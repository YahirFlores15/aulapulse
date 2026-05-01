import { TeacherServiceError } from "@/server/domains/teacher/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import { ZodError } from "zod";


export async function requireTeacherSession() {
    const auth = await requireRole(ROLE.TEACHER);

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

export function parseCourseId(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new TeacherServiceError("courseId inválido.", 400);
    }

    return parsed;
}

function buildZodErrorMessage(error: ZodError) {
    if (error.issues.length === 0) {
        return "Datos inválidos.";
    }

    return error.issues.map((issue) => issue.message).join(" ");
}

export function handleTeacherError(error: unknown) {
    if (error instanceof TeacherServiceError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status },
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                error: buildZodErrorMessage(error),
                issues: error.issues,
            },
            { status: 400 },
        );
    }

    console.error(error);

    return NextResponse.json(
        { error: "Error interno del servidor." },
        { status: 500 },
    );
}

export function handleTeacherApiError(error: unknown) {
    return handleTeacherError(error);
}

export function handleTeacherRouteError(error: unknown) {
    return handleTeacherError(error);
}