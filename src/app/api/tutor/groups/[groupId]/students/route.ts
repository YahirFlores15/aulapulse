import { getGroupStudentsWithRisk } from "@/server/domains/tutor/service";
import { NextResponse } from "next/server";

import { handleTutorError, parseNumericParam, requireTutorSession, } from "../../../_utils";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        groupId: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const { groupId } = await context.params;
        const parsedGroupId = parseNumericParam(groupId, "groupId");

        if (parsedGroupId instanceof NextResponse) {
            return parsedGroupId;
        }

        const result = getGroupStudentsWithRisk(
            parsedGroupId,
            auth.session.userId,
        );

        return NextResponse.json(result);
    } catch (error) {
        return handleTutorError(error);
    }
}