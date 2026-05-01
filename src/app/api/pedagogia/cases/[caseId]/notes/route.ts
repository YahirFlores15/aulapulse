import { addSupportAreaCaseNote, listSupportAreaCaseNotes, } from "@/server/domains/support/service";
import { handleSupportAreaApiError, parseSupportAreaCaseId, } from "@/app/api/support-area-utils";
import { supportCaseNoteSchema } from "@/shared/schemas/support/case-note.schema";
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

const area = getSupportAreaConfig("pedagogia");

function redirectToCase(caseId: number) {
    return new NextResponse(null, {
        status: 303,
        headers: {
            Location: `${area.casesPath}/${caseId}`,
        },
    });
}

export async function GET(_request: Request, context: RouteContext) {
    try {
        const auth = await requireRole(ROLE.PEDAGOGIA);

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseSupportAreaCaseId(caseId);

        if (parsedCaseId instanceof NextResponse) {
            return parsedCaseId;
        }

        const notes = listSupportAreaCaseNotes({
            userId: auth.session.userId,
            role: ROLE.PEDAGOGIA,
            targetArea: area.targetArea,
            caseId: parsedCaseId,
        });

        return NextResponse.json({
            ok: true,
            notes,
        });
    } catch (error) {
        return handleSupportAreaApiError(error);
    }
}

export async function POST(request: Request, context: RouteContext) {
    try {
        const auth = await requireRole(ROLE.PEDAGOGIA);

        if (!auth.ok) {
            return auth.response;
        }

        const { caseId } = await context.params;
        const parsedCaseId = parseSupportAreaCaseId(caseId);

        if (parsedCaseId instanceof NextResponse) {
            return parsedCaseId;
        }

        const contentType = request.headers.get("content-type") ?? "";
        const isJsonRequest = contentType.includes("application/json");

        let rawInput: unknown;

        if (isJsonRequest) {
            rawInput = await request.json();
        } else {
            const formData = await request.formData();

            rawInput = {
                note: formData.get("note"),
            };
        }

        const input = supportCaseNoteSchema.parse(rawInput);

        const note = addSupportAreaCaseNote(
            {
                userId: auth.session.userId,
                role: ROLE.PEDAGOGIA,
                targetArea: area.targetArea,
                caseId: parsedCaseId,
            },
            input,
        );

        if (isJsonRequest) {
            return NextResponse.json(
                {
                    ok: true,
                    data: note,
                },
                { status: 201 },
            );
        }

        return redirectToCase(parsedCaseId);
    } catch (error) {
        return handleSupportAreaApiError(error);
    }
}