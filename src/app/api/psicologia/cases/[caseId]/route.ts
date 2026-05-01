import { handleSupportAreaApiError, parseSupportAreaCaseId, } from "@/app/api/support-area-utils";
import { getSupportAreaCaseDetail } from "@/server/domains/support/service";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

const area = getSupportAreaConfig("psicologia");

export async function GET(_request: Request, context: RouteContext) {
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

        const detail = getSupportAreaCaseDetail({
            userId: auth.session.userId,
            role: ROLE.PSICOLOGIA,
            targetArea: area.targetArea,
            caseId: parsedCaseId,
        });

        return NextResponse.json({
            ok: true,
            data: detail,
        });
    } catch (error) {
        return handleSupportAreaApiError(error);
    }
}