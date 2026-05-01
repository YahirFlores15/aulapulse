import { supportCasesQuerySchema } from "@/shared/schemas/support/case.schema";
import { handleSupportAreaApiError } from "@/app/api/support-area-utils";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { listSupportAreaCases } from "@/server/domains/support/service";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";


export const runtime = "nodejs";

const area = getSupportAreaConfig("pedagogia");

export async function GET(request: NextRequest) {
    try {
        const auth = await requireRole(ROLE.PEDAGOGIA);

        if (!auth.ok) {
            return auth.response;
        }

        const query = supportCasesQuerySchema.parse({
            status: request.nextUrl.searchParams.get("status") ?? undefined,
        });

        const cases = listSupportAreaCases({
            userId: auth.session.userId,
            role: ROLE.PEDAGOGIA,
            targetArea: area.targetArea,
            query,
        });

        return NextResponse.json({
            ok: true,
            cases,
        });
    } catch (error) {
        return handleSupportAreaApiError(error);
    }
}