import { createTutorReferralCase, listAvailableReferralReasons, listTutorReferralCases, } from "@/server/domains/tutor/service";
import { createReferralSchema } from "@/shared/schemas/tutor/referral.schema";
import { NextResponse } from "next/server";

import { handleTutorError, requireTutorSession } from "../_utils";


export const runtime = "nodejs";

export async function GET() {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const items = listTutorReferralCases(auth.session.userId);
        const reasons = listAvailableReferralReasons();

        return NextResponse.json({
            items,
            reasons,
        });
    } catch (error) {
        return handleTutorError(error);
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const body = await request.json();
        const input = createReferralSchema.parse(body);

        const referralCase = await createTutorReferralCase(auth.session.userId, input);

        return NextResponse.json(referralCase, { status: 201 });
    } catch (error) {
        return handleTutorError(error);
    }
}