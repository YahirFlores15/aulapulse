import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleDirectorError } from "../_utils";


export const runtime = "nodejs";

const createGroupSchema = z.object({
    code: z.string().trim().min(1, "El código del grupo es obligatorio"),
    name: z.string().trim().min(1, "El nombre del grupo es obligatorio"),
});

export async function GET() {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const groups = await directorService.listGroups();
        return NextResponse.json({ data: groups });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function POST(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json().catch(() => null);
        const parsed = createGroupSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const group = await directorService.createGroup(parsed.data);
        return NextResponse.json({ data: group }, { status: 201 });
    } catch (error) {
        return handleDirectorError(error);
    }
}