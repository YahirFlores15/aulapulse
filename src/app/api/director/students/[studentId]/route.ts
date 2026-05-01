import { updateStudentSchema } from "@/shared/schemas/director/student.schema";
import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError, parseIdParam } from "../../_utils";


export const runtime = "nodejs";

type Params = {
    params: Promise<{ studentId: string }>;
};

export async function GET(_: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { studentId } = await params;
        const parsedId = parseIdParam(studentId, "studentId");
        if (parsedId instanceof NextResponse) return parsedId;

        const student = await directorService.getStudent(parsedId);
        return NextResponse.json({ data: student });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function PATCH(request: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { studentId } = await params;
        const parsedId = parseIdParam(studentId, "studentId");
        if (parsedId instanceof NextResponse) return parsedId;

        const body = await request.json().catch(() => null);
        const parsed = updateStudentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const student = await directorService.updateStudent(parsedId, parsed.data);
        return NextResponse.json({ data: student });
    } catch (error) {
        return handleDirectorError(error);
    }
}