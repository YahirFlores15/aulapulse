import { handleSupportAreaApiError, parseSupportAreaCaseId, } from "@/app/api/support-area-utils";
import { closeReferralCaseSchema } from "@/shared/schemas/referrals/referral-workflow.schema";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { closeSupportAreaCase } from "@/server/domains/support/service";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

const area = getSupportAreaConfig("psicologia");

function redirectToCase(caseId: number) {
    return new NextResponse(null, {
        status: 303,
        headers: {
            Location: `${area.casesPath}/${caseId}`,
        },
    });
}

async function readRequestBody(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return await request.json();
    }

    const formData = await request.formData();

    return {
        note: typeof formData.get("note") === "string" ? formData.get("note") : "",
    };
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireRole(ROLE.PSICOLOGIA);

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseSupportAreaCaseId(caseId);

        if (parsedCaseId instanceof NextResponse) {
            return parsedCaseId;
        }

        const rawBody = await readRequestBody(request);
        const input = closeReferralCaseSchema.parse(rawBody);

        const detail = closeSupportAreaCase(
            {
                userId: auth.session.userId,
                role: ROLE.PSICOLOGIA,
                targetArea: area.targetArea,
                caseId: parsedCaseId,
            },
            input,
        );

        const acceptsHtml = (request.headers.get("accept") ?? "").includes("text/html");

        if (acceptsHtml) {
            return redirectToCase(detail.caseItem.id);
        }

        return NextResponse.json({
            ok: true,
            data: detail,
        });
    } catch (error) {
        return handleSupportAreaApiError(error);
    }
}