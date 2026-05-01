import { createCourseSchema } from "@/shared/schemas/director/course.schema";
import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError } from "../_utils";


export const runtime = "nodejs";

export async function GET() {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const courses = await directorService.listCourses();
        return NextResponse.json({ data: courses });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function POST(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json().catch(() => null);
        const parsed = createCourseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const course = await directorService.createCourse(parsed.data);
        return NextResponse.json({ data: course }, { status: 201 });
    } catch (error) {
        return handleDirectorError(error);
    }
}