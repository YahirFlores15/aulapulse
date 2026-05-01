import { directorReferralCaseParamsSchema, reopenReferralCaseSchema, } from "@/shared/schemas/referrals/referral-workflow.schema";
import { reopenReferralCaseForActor } from "@/server/domains/referrals/service";
import { ReferralWorkflowError } from "@/server/domains/referrals/errors";
import { buildRedirectUrl } from "@/server/http/request-origin";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

async function readBody(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return await request.json();
    }

    if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
    ) {
        const formData = await request.formData();

        return {
            note: formData.get("note"),
        };
    }

    return {};
}

export async function POST(request: NextRequest, context: RouteContext) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const params = await context.params;
        const parsedParams = directorReferralCaseParamsSchema.parse(params);
        const rawBody = await readBody(request);
        const input = reopenReferralCaseSchema.parse({
            note: typeof rawBody.note === "string" ? rawBody.note : "",
        });

        const detail = reopenReferralCaseForActor(
            auth.session.userId,
            auth.session.roles,
            parsedParams.caseId,
            input,
        );

        const acceptsHtml = (request.headers.get("accept") ?? "").includes("text/html");

        if (acceptsHtml) {
            return NextResponse.redirect(
                buildRedirectUrl(
                    request,
                    `/director/referrals/${parsedParams.caseId}`,
                ),
                303,
            );
        }

        return NextResponse.json(detail);
    } catch (error) {
        if (error instanceof ReferralWorkflowError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("[DIRECTOR_REFERRAL_REOPEN_ERROR]", error);

        return NextResponse.json(
            { error: "No se pudo reabrir la canalización." },
            { status: 500 },
        );
    }
}