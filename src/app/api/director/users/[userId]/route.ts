import { updateUserSchema } from "@/shared/schemas/director/user.schema";
import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";

import { handleDirectorError, parseIdParam } from "../../_utils";


export const runtime = "nodejs";

type Params = {
    params: Promise<{ userId: string }>;
};

export async function GET(_: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { userId } = await params;
        const parsedId = parseIdParam(userId, "userId");
        if (parsedId instanceof NextResponse) return parsedId;

        const user = await directorService.getOperationalUser(parsedId);
        return NextResponse.json({ data: user });
    } catch (error) {
        return handleDirectorError(error);
    }
}

export async function PATCH(request: Request, { params }: Params) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const { userId } = await params;
        const parsedId = parseIdParam(userId, "userId");
        if (parsedId instanceof NextResponse) return parsedId;

        const body = await request.json().catch(() => null);
        const parsed = updateUserSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const user = await directorService.updateOperationalUser(parsedId, parsed.data);
        return NextResponse.json({ data: user });
    } catch (error) {
        return handleDirectorError(error);
    }
}