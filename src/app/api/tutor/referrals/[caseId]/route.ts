import { getTutorReferralCaseDetail, updateTutorReferralCaseSummary, } from "@/server/domains/tutor/service";
import { updateReferralSummarySchema } from "@/shared/schemas/tutor/referral.schema";
import { NextRequest, NextResponse } from "next/server";

import { handleTutorError, parseTutorNumericId, redirectToAppPath, requireTutorSession, } from "../../_utils";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

function normalizeFormValue(value: FormDataEntryValue | null): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}

async function readUpdatePayload(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return await request.json();
    }

    if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
    ) {
        const formData = await request.formData();

        const summary = normalizeFormValue(formData.get("summary"));

        return {
            summary,
        };
    }

    return {};
}

export async function GET(_request: Request, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseTutorNumericId(caseId, "caseId");

        const result = getTutorReferralCaseDetail(parsedCaseId, auth.session.userId);

        return NextResponse.json(result);
    } catch (error) {
        return handleTutorError(error);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseTutorNumericId(caseId, "caseId");

        const body = await readUpdatePayload(request);
        const input = updateReferralSummarySchema.parse(body);

        const updated = updateTutorReferralCaseSummary(
            parsedCaseId,
            auth.session.userId,
            input,
        );

        return NextResponse.json(updated);
    } catch (error) {
        return handleTutorError(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseTutorNumericId(caseId, "caseId");

        const formData = await request.formData();
        const methodOverride = String(formData.get("_method") ?? "").toUpperCase();

        if (methodOverride !== "PATCH") {
            return NextResponse.json(
                { error: "Método no soportado." },
                { status: 405 },
            );
        }

        const rawSummary = formData.get("summary");

        await updateTutorReferralCaseSummary(
            parsedCaseId,
            auth.session.userId,
            updateReferralSummarySchema.parse({
                summary: typeof rawSummary === "string" ? rawSummary.trim() : undefined,
            }),
        );

        return redirectToAppPath(`/tutor/referrals/${parsedCaseId}`);
    } catch (error) {
        return handleTutorError(error);
    }
}