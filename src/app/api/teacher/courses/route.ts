import { handleTeacherApiError, requireTeacherSession, } from "@/app/api/teacher/_utils";
import { TeacherService } from "@/server/domains/teacher/service";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

const service = new TeacherService();

export async function GET() {
    try {
        const auth = await requireTeacherSession();

        if (!auth.ok) {
            return auth.response;
        }

        const courses = service.listCourses(auth.session.userId);

        return NextResponse.json({
            ok: true,
            data: courses,
        });
    } catch (error) {
        return handleTeacherApiError(error);
    }
}