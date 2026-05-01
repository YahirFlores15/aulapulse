import { closeTutorReferralCase } from "@/server/domains/tutor/service";
import { NextRequest } from "next/server";

import { handleTutorError, parseTutorNumericId, redirectToAppPath, requireTutorSession, } from "../../../_utils";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseTutorNumericId(caseId, "caseId");

        const formData = await request.formData();
        const rawInput = {
            note:
                typeof formData.get("note") === "string"
                    ? String(formData.get("note")).trim()
                    : "",
        };

        await closeTutorReferralCase(parsedCaseId, auth.session.userId, rawInput);

        return redirectToAppPath(`/tutor/referrals/${parsedCaseId}`);
    } catch (error) {
        return handleTutorError(error);
    }
}