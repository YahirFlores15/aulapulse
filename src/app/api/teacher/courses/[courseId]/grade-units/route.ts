import { handleTeacherApiError, requireTeacherSession, } from "@/app/api/teacher/_utils";
import { teacherCourseRouteParamsSchema } from "@/shared/schemas/teacher/courses.schema";
import { replaceGradeUnitsSchema } from "@/shared/schemas/teacher/grade-units.schema";
import { TeacherService } from "@/server/domains/teacher/service";
import { NextRequest, NextResponse } from "next/server";


export const runtime = "nodejs";

const service = new TeacherService();

type RouteContext = {
    params: Promise<{
        courseId: string;
    }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = teacherCourseRouteParamsSchema.parse(params);

        const result = service.getGradeUnits(
            auth.session.userId,
            parsedParams.courseId,
        );

        return NextResponse.json({
            ok: true,
            data: result,
        });
    } catch (error) {
        return handleTeacherApiError(error);
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
        const parsedBody = replaceGradeUnitsSchema.parse(body);

        const result = service.saveGradeUnits(
            auth.session.userId,
            parsedParams.courseId,
            parsedBody,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "Unidades de evaluación guardadas correctamente.",
        });
    } catch (error) {
        return handleTeacherApiError(error);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = teacherCourseRouteParamsSchema.parse(params);
        const body = await request.json();
        const parsedBody = replaceGradeUnitsSchema.parse(body);

        const result = service.saveGradeUnits(
            auth.session.userId,
            parsedParams.courseId,
            parsedBody,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "Unidades de evaluación actualizadas correctamente.",
        });
    } catch (error) {
        return handleTeacherApiError(error);
    }
}