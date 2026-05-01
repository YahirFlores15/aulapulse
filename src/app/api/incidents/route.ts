import { createIncidentSchema, incidentListQuerySchema, } from "@/shared/schemas/incidents/incidents.schema";
import { IncidentServiceError } from "@/server/domains/incidents/errors";
import { IncidentService } from "@/server/domains/incidents/service";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { ZodError } from "zod";


export const runtime = "nodejs";

const service = new IncidentService();

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

export async function GET(request: NextRequest) {
    try {
        const auth = await requireIncidentActorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const query = incidentListQuerySchema.parse({
            status: request.nextUrl.searchParams.get("status") ?? undefined,
            studentId: request.nextUrl.searchParams.get("studentId") ?? undefined,
            courseId: request.nextUrl.searchParams.get("courseId") ?? undefined,
            groupId: request.nextUrl.searchParams.get("groupId") ?? undefined,
        });

        const result = service.listIncidents(auth.session, query);

        return NextResponse.json({
            ok: true,
            data: result,
        });
    } catch (error) {
        return handleIncidentApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireIncidentActorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const body = await request.json();
        const input = createIncidentSchema.parse(body);

        const result = await service.createIncident(auth.session, input);

        return NextResponse.json(
            {
                ok: true,
                data: result,
                message: "Incidencia registrada correctamente.",
            },
            { status: 201 },
        );
    } catch (error) {
        return handleIncidentApiError(error);
    }
}