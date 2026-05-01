import { directorReferralCaseParamsSchema } from "@/shared/schemas/referrals/referral-workflow.schema";
import { getReferralCaseDetailForActor } from "@/server/domains/referrals/service";
import { ReferralWorkflowError } from "@/server/domains/referrals/errors";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const params = await context.params;
        const parsedParams = directorReferralCaseParamsSchema.parse(params);

        const detail = getReferralCaseDetailForActor(
            auth.session.userId,
            auth.session.roles,
            parsedParams.caseId,
        );

        return NextResponse.json(detail);
    } catch (error) {
        if (error instanceof ReferralWorkflowError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("[DIRECTOR_REFERRAL_DETAIL_ERROR]", error);

        return NextResponse.json(
            { error: "No se pudo cargar el detalle de la canalización." },
            { status: 500 },
        );
    }
}