import { createIncidentSchema, studentIncidentsParamsSchema, } from "@/shared/schemas/incidents/incidents.schema";
import { IncidentServiceError } from "@/server/domains/incidents/errors";
import { IncidentService } from "@/server/domains/incidents/service";
import { requireDirectorSession } from "@/app/api/director/_utils";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";


export const runtime = "nodejs";

const service = new IncidentService();

type RouteContext = {
    params: Promise<{
        studentId: string;
    }>;
};

function buildZodErrorMessage(error: ZodError) {
    if (error.issues.length === 0) {
        return "Datos inválidos.";
    }

    return error.issues.map((issue) => issue.message).join(" ");
}

function handleDirectorIncidentApiError(error: unknown) {
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

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const session = await requireDirectorSession();

        if (session instanceof NextResponse) {
            return session;
        }

        const params = await context.params;
        const { studentId } = studentIncidentsParamsSchema.parse(params);

        const result = service.listIncidents(session, {
            studentId,
        });

        return NextResponse.json({
            ok: true,
            data: result,
        });
    } catch (error) {
        return handleDirectorIncidentApiError(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await requireDirectorSession();

        if (session instanceof NextResponse) {
            return session;
        }

        const params = await context.params;
        const { studentId } = studentIncidentsParamsSchema.parse(params);

        const body = await request.json();
        const parsedBody = createIncidentSchema.parse({
            ...body,
            studentId,
        });

        const result = await service.createIncident(session, parsedBody);

        return NextResponse.json(
            {
                ok: true,
                data: result,
                message: "Incidencia registrada correctamente.",
            },
            { status: 201 },
        );
    } catch (error) {
        return handleDirectorIncidentApiError(error);
    }
}