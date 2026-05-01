import type { AuthSessionResponseDto } from "@/shared/dtos/auth/session.dto";
import { getValidatedSession } from "@/server/auth/session";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

export async function GET() {
    const session = await getValidatedSession();

    if (!session) {
        const response: AuthSessionResponseDto = {
            user: null,
        };

        return NextResponse.json(response, { status: 401 });
    }

    const response: AuthSessionResponseDto = {
        user: {
            id: session.userId,
            email: session.email,
            roles: session.roles,
            activeRole: session.activeRole,
            sessionVersion: session.sessionVersion,
            issuedAt: session.issuedAt,
            expiresAt: session.expiresAt,
            mustChangePassword: session.mustChangePassword,
        },
    };

    return NextResponse.json(response);
}