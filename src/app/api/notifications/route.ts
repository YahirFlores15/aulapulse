import { getNotificationsForUser, NotificationServiceError, } from "@/server/domains/notifications/service";
import { listNotificationsQuerySchema } from "@/shared/schemas/notifications/notification.schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";


export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
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

        const input = listNotificationsQuerySchema.parse({
            limit: request.nextUrl.searchParams.get("limit") ?? undefined,
            unreadOnly: request.nextUrl.searchParams.get("unreadOnly") ?? undefined,
        });

        const items = getNotificationsForUser(auth.session.userId, {
            limit: input.limit,
            unreadOnly: input.unreadOnly,
        });

        return NextResponse.json({ items });
    } catch (error) {
        return handleNotificationError(error);
    }
}