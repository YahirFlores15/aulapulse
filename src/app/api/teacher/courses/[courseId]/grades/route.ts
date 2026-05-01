import { handleTeacherApiError, requireTeacherSession, } from "@/app/api/teacher/_utils";
import { teacherCourseRouteParamsSchema } from "@/shared/schemas/teacher/courses.schema";
import { saveGradeEntriesSchema } from "@/shared/schemas/teacher/grade-capture.schema";
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

        const result = service.getGrades(
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
        const parsedBody = saveGradeEntriesSchema.parse(body);

        const result = service.saveGrades(
            auth.session.userId,
            parsedParams.courseId,
            parsedBody,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "Calificaciones guardadas correctamente.",
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
        const parsedBody = saveGradeEntriesSchema.parse(body);

        const result = service.saveGrades(
            auth.session.userId,
            parsedParams.courseId,
            parsedBody,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "Calificaciones actualizadas correctamente.",
        });
    } catch (error) {
        return handleTeacherApiError(error);
    }
}