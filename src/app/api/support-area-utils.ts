import { SupportServiceError } from "@/server/domains/support/service";
import { NextResponse } from "next/server";
import { ZodError } from "zod";


export function parseSupportAreaCaseId(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
            {
                ok: false,
                error: "caseId inválido.",
            },
            { status: 400 },
        );
    }

    return parsed;
}

export function handleSupportAreaApiError(error: unknown) {
    if (error instanceof SupportServiceError) {
        return NextResponse.json(
            {
                ok: false,
                error: error.message,
            },
            { status: error.status },
        );
    }

    if (error instanceof ZodError) {
        const message =
            error.issues.length > 0
                ? error.issues.map((issue) => issue.message).join(" ")
                : "Datos inválidos.";

        return NextResponse.json(
            {
                ok: false,
                error: message,
                issues: error.issues,
            },
            { status: 400 },
        );
    }

    return NextResponse.json(
        {
            ok: false,
            error: "Error interno del servidor.",
        },
        { status: 500 },
    );
}