import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError, parseIdParam } from "../../_utils";


export const runtime = "nodejs";

type Params = {
    params: Promise<{ cycleId: string }>;
};

export async function GET(_: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { cycleId } = await params;
        const parsedId = parseIdParam(cycleId, "cycleId");
        if (parsedId instanceof NextResponse) return parsedId;

        const cycle = await directorService.getCycle(parsedId);
        return NextResponse.json({ data: cycle });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function PATCH() {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    return NextResponse.json(
        {
            error: "Los ciclos escolares automáticos no se editan manualmente desde Dirección.",
        },
        { status: 403 },
    );
}