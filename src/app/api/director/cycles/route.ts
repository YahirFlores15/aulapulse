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
        const cycles = await directorService.listCycles();
        return NextResponse.json({ data: cycles });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function POST() {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    return NextResponse.json(
        {
            error: "Los ciclos escolares ahora se generan automáticamente por cuatrimestre.",
        },
        { status: 403 },
    );
}