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
        const teachers = await directorService.listTeacherCandidatesForTutorAssignment();
        return NextResponse.json({ data: teachers });
    } catch (error) {
        return handleDirectorError(error);
    }
}