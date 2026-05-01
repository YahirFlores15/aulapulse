import { handleTeacherApiError, requireTeacherSession, } from "@/app/api/teacher/_utils";
import { mapIncidentListItemToTeacherIncidentDto } from "@/shared/dtos/teacher/capture.dto";
import { teacherCourseRouteParamsSchema } from "@/shared/schemas/teacher/courses.schema";
import { createIncidentSchema } from "@/shared/schemas/incidents/incidents.schema";
import { IncidentServiceError } from "@/server/domains/incidents/errors";
import { IncidentService } from "@/server/domains/incidents/service";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";


export const runtime = "nodejs";

const service = new IncidentService();

type RouteContext = {
    params: Promise<{
        courseId: string;
    }>;
};

function buildTeacherIncidentsResponse(input: {
    courseId: number;
    items: ReturnType<IncidentService["listIncidents"]>["items"];
}) {
    return {
        courseId: input.courseId,
        records: input.items.map(mapIncidentListItemToTeacherIncidentDto),
    };
}

function handleTeacherIncidentApiError(error: unknown) {
    if (error instanceof IncidentServiceError) {
        return NextResponse.json(
            {
                ok: false,
                error: error.message,
                message: error.message,
                code: error.code,
                ...(error.details !== undefined ? { details: error.details } : {}),
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
                message,
                issues: error.issues,
            },
            { status: 400 },
        );
    }

    return handleTeacherApiError(error);
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = teacherCourseRouteParamsSchema.parse(params);

        const result = service.listIncidents(auth.session, {
            courseId: parsedParams.courseId,
        });

        return NextResponse.json({
            ok: true,
            data: buildTeacherIncidentsResponse({
                courseId: parsedParams.courseId,
                items: result.items,
            }),
        });
    } catch (error) {
        return handleTeacherIncidentApiError(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = teacherCourseRouteParamsSchema.parse(params);
        const body = await request.json();

        const parsedBody = createIncidentSchema.parse({
            ...body,
            courseId: parsedParams.courseId,
        });

        const result = await service.createIncident(auth.session, parsedBody);

        const listResult = service.listIncidents(auth.session, {
            courseId: parsedParams.courseId,
        });

        return NextResponse.json({
            ok: true,
            data: buildTeacherIncidentsResponse({
                courseId: parsedParams.courseId,
                items: listResult.items,
            }),
            notificationStatus: result.notificationStatus,
            message: "Incidencia registrada correctamente.",
        });
    } catch (error) {
        return handleTeacherIncidentApiError(error);
    }
}