import { addTutorReferralCaseNote, listTutorReferralCaseNotes, } from "@/server/domains/tutor/service";
import { createReferralNoteSchema } from "@/shared/schemas/tutor/referral-note.schema";
import { NextRequest, NextResponse } from "next/server";

import { handleTutorError, parseTutorNumericId, redirectToAppPath, requireTutorSession, } from "../../../_utils";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        caseId: string;
    }>;
};

async function readRequestBody(request: NextRequest) {
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

export async function GET(_request: Request, context: RouteContext) {
    try {
        const auth = await requireTutorSession();

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseTutorNumericId(caseId, "caseId");

        const notes = listTutorReferralCaseNotes(parsedCaseId, auth.session.userId);

        return NextResponse.json({ items: notes });
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

        const rawBody = await readRequestBody(request);

        const input = createReferralNoteSchema.parse({
            note: typeof rawBody.note === "string" ? rawBody.note : "",
        });

        await addTutorReferralCaseNote(
            parsedCaseId,
            auth.session.userId,
            input,
        );

        const acceptsHtml = (request.headers.get("accept") ?? "").includes("text/html");

        if (acceptsHtml) {
            return redirectToAppPath(`/tutor/referrals/${parsedCaseId}`);
        }

        const notes = listTutorReferralCaseNotes(parsedCaseId, auth.session.userId);
        const createdNote = notes[notes.length - 1] ?? null;

        return NextResponse.json(createdNote, { status: 201 });
    } catch (error) {
        return handleTutorError(error);
    }
}