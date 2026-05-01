import { directorReferralFiltersSchema } from "@/shared/schemas/referrals/referral-workflow.schema";
import { listDirectorReferralCases } from "@/server/domains/referrals/service";
import { ReferralWorkflowError } from "@/server/domains/referrals/errors";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";


export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const filters = directorReferralFiltersSchema.parse({
            status: request.nextUrl.searchParams.get("status") ?? undefined,
            targetArea: request.nextUrl.searchParams.get("targetArea") ?? undefined,
            groupId: request.nextUrl.searchParams.get("groupId") ?? undefined,
            studentId: request.nextUrl.searchParams.get("studentId") ?? undefined,
            incidentId: request.nextUrl.searchParams.get("incidentId") ?? undefined,
            createdByUserId: request.nextUrl.searchParams.get("createdByUserId") ?? undefined,
            relatedTeacherUserId:
                request.nextUrl.searchParams.get("relatedTeacherUserId") ?? undefined,
        });

        const items = listDirectorReferralCases(filters);

        return NextResponse.json({ items });
    } catch (error) {
        if (error instanceof ReferralWorkflowError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("[DIRECTOR_REFERRALS_LIST_ERROR]", error);

        return NextResponse.json(
            { error: "No se pudieron cargar las canalizaciones." },
            { status: 500 },
        );
    }
}