import { getUnreadNotificationsCountForUser, NotificationServiceError, } from "@/server/domains/notifications/service";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";


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

export async function GET() {
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

        const result = getUnreadNotificationsCountForUser(auth.session.userId);

        return NextResponse.json(result);
    } catch (error) {
        return handleNotificationError(error);
    }
}