import { createIncidentSchema, tutorGroupIncidentsParamsSchema, } from "@/shared/schemas/incidents/incidents.schema";
import { IncidentServiceError } from "@/server/domains/incidents/errors";
import { IncidentService } from "@/server/domains/incidents/service";
import { requireTutorSession } from "@/app/api/tutor/_utils";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";


export const runtime = "nodejs";

const service = new IncidentService();

type RouteContext = {
    params: Promise<{
        groupId: string;
    }>;
};

function buildZodErrorMessage(error: ZodError) {
    if (error.issues.length === 0) {
        return "Datos inválidos.";
    }

    return error.issues.map((issue) => issue.message).join(" ");
}

function handleTutorIncidentApiError(error: unknown) {
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

    return NextResponse.json(
        {
            ok: false,
            error: "Error interno del servidor.",
        },
        { status: 500 },
    );
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const { groupId } = tutorGroupIncidentsParamsSchema.parse(params);

        const result = service.listIncidents(auth.session, {
            groupId,
        });

        return NextResponse.json({
            ok: true,
            data: result,
        });
    } catch (error) {
        return handleTutorIncidentApiError(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const { groupId } = tutorGroupIncidentsParamsSchema.parse(params);

        const body = await request.json();
        const parsedBody = createIncidentSchema.parse({
            ...body,
            groupId,
        });

        const result = await service.createIncident(auth.session, parsedBody);

        return NextResponse.json(
            {
                ok: true,
                data: result,
                message: "Incidencia registrada correctamente.",
            },
            { status: 201 },
        );
    } catch (error) {
        return handleTutorIncidentApiError(error);
    }
}