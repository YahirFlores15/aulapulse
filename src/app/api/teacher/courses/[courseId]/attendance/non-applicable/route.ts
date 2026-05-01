import { handleTeacherApiError, requireTeacherSession, } from "@/app/api/teacher/_utils";
import { markTodayNonApplicableSchema } from "@/shared/schemas/teacher/attendance.schema";
import { teacherCourseRouteParamsSchema } from "@/shared/schemas/teacher/courses.schema";
import { TeacherService } from "@/server/domains/teacher/service";
import { NextRequest, NextResponse } from "next/server";


export const runtime = "nodejs";

const service = new TeacherService();

type RouteContext = {
    params: Promise<{
        courseId: string;
    }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = teacherCourseRouteParamsSchema.parse(params);
        const body = await request.json();
        const parsedBody = markTodayNonApplicableSchema.parse(body);

        const result = service.markTodayAttendanceAsNonApplicable(
            auth.session.userId,
            parsedParams.courseId,
            parsedBody,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "El día fue marcado como no aplica para este curso.",
        });
    } catch (error) {
        return handleTeacherApiError(error);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = teacherCourseRouteParamsSchema.parse(params);

        const result = service.unmarkTodayAttendanceAsNonApplicable(
            auth.session.userId,
            parsedParams.courseId,
        );

        return NextResponse.json({
            ok: true,
            data: result,
            message: "La marca de no aplica fue retirada.",
        });
    } catch (error) {
        return handleTeacherApiError(error);
    }
}