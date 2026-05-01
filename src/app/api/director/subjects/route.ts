import { createSubjectSchema } from "@/shared/schemas/director/subject.schema";
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
        const subjects = await directorService.listSubjects();
        return NextResponse.json({ data: subjects });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function POST(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json().catch(() => null);
        const parsed = createSubjectSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const subject = await directorService.createSubject(parsed.data);
        return NextResponse.json({ data: subject }, { status: 201 });
    } catch (error) {
        return handleDirectorError(error);
    }
}