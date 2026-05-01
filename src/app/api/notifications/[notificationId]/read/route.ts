import { markNotificationReadSchema, notificationIdParamsSchema, } from "@/shared/schemas/notifications/notification.schema";
import { NotificationServiceError, readNotificationForUser, } from "@/server/domains/notifications/service";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        notificationId: string;
    }>;
};

function handleNotificationError(error: unknown) {
    if (error instanceof NotificationServiceError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status },
        );
    }

    console.error(error);

    return NextResponse.json(
        { error: "Error interno del servidor." },
        { status: 500 },
    );
}

function redirectToPath(path: string) {
    return new NextResponse(null, {
        status: 303,
        headers: {
            Location: path,
        },
    });
}

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
            redirectTo:
                typeof formData.get("redirectTo") === "string"
                    ? String(formData.get("redirectTo"))
                    : undefined,
        };
    }

    return {};
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const auth = await requireAnyRole([
            ROLE.DIRECTOR,
            ROLE.TUTOR,
            ROLE.PEDAGOGIA,
            ROLE.PSICOLOGIA,
        ]);

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const { notificationId } = notificationIdParamsSchema.parse(params);
        const body = await readRequestBody(request);
        const input = markNotificationReadSchema.parse(body);

        const updated = readNotificationForUser(notificationId, auth.session.userId);

        const acceptsHtml = (request.headers.get("accept") ?? "").includes("text/html");

        if (acceptsHtml && input.redirectTo) {
            return redirectToPath(input.redirectTo);
        }

        return NextResponse.json(updated);
    } catch (error) {
        return handleNotificationError(error);
    }
}