import { addIncidentNoteSchema, incidentIdParamsSchema, } from "@/shared/schemas/incidents/incidents.schema";
import { IncidentServiceError } from "@/server/domains/incidents/errors";
import { IncidentService } from "@/server/domains/incidents/service";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { ZodError } from "zod";


export const runtime = "nodejs";

const service = new IncidentService();

type RouteContext = {
    params: Promise<{
        incidentId: string;
    }>;
};

function buildZodErrorMessage(error: ZodError) {
    if (error.issues.length === 0) {
        return "Datos inválidos.";
    }

    return error.issues.map((issue) => issue.message).join(" ");
}

function handleIncidentApiError(error: unknown) {
    if (error instanceof IncidentServiceError) {
        return NextResponse.json(
            {
                ok: false,
                error: error.message,
                code: error.code,
                ...(error.details !== undefined ? { details: error.details } : {}),
            },
            { status: error.status },
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                ok: false,
                error: buildZodErrorMessage(error),
                issues: error.issues,
            },
            { status: 400 },
        );
    }

    console.error(error);

    return NextResponse.json(
        {
            ok: false,
            error: "Error interno del servidor.",
        },
        { status: 500 },
    );
}

async function requireIncidentActorSession() {
    const auth = await requireAnyRole([
        ROLE.DIRECTOR,
        ROLE.TEACHER,
        ROLE.TUTOR,
    ]);

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

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireIncidentActorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const { incidentId } = incidentIdParamsSchema.parse(params);

        const body = await request.json();
        const input = addIncidentNoteSchema.parse(body);

        const result = await service.addIncidentNote(
            auth.session,
            incidentId,
            input,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "Nota agregada correctamente.",
        });
    } catch (error) {
        return handleIncidentApiError(error);
    }
}