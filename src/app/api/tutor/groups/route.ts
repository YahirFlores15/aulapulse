import { listAssignedGroups } from "@/server/domains/tutor/service";
import { NextResponse } from "next/server";

import { handleTutorError, requireTutorSession } from "../_utils";


export const runtime = "nodejs";

export async function GET() {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const groups = listAssignedGroups(auth.session.userId);

        return NextResponse.json({
            items: groups,
        });
    } catch (error) {
        return handleTutorError(error);
    }
}