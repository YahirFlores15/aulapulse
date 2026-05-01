import { updateGroupSchema } from "@/shared/schemas/director/group.schema";
import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError, parseIdParam } from "../../_utils";


export const runtime = "nodejs";

type Params = {
    params: Promise<{ groupId: string }>;
};

export async function GET(_: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { groupId } = await params;
        const parsedId = parseIdParam(groupId, "groupId");
        if (parsedId instanceof NextResponse) return parsedId;

        const group = await directorService.getGroup(parsedId);
        return NextResponse.json({ data: group });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function PATCH(request: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { groupId } = await params;
        const parsedId = parseIdParam(groupId, "groupId");
        if (parsedId instanceof NextResponse) return parsedId;

        const body = await request.json().catch(() => null);
        const parsed = updateGroupSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const group = await directorService.updateGroup(parsedId, parsed.data);
        return NextResponse.json({ data: group });
    } catch (error) {
        return handleDirectorError(error);
    }
}