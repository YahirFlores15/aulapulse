import { updateSubjectSchema } from "@/shared/schemas/director/subject.schema";
import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError, parseIdParam } from "../../_utils";


export const runtime = "nodejs";

type Params = {
    params: Promise<{ subjectId: string }>;
};

export async function GET(_: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { subjectId } = await params;
        const parsedId = parseIdParam(subjectId, "subjectId");
        if (parsedId instanceof NextResponse) return parsedId;

        const subject = await directorService.getSubject(parsedId);
        return NextResponse.json({ data: subject });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function PATCH(request: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { subjectId } = await params;
        const parsedId = parseIdParam(subjectId, "subjectId");
        if (parsedId instanceof NextResponse) return parsedId;

        const body = await request.json().catch(() => null);
        const parsed = updateSubjectSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const subject = await directorService.updateSubject(parsedId, parsed.data);
        return NextResponse.json({ data: subject });
    } catch (error) {
        return handleDirectorError(error);
    }
}