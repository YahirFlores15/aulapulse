import type { AuthSessionResponseDto } from "@/shared/dtos/auth/session.dto";
import { requireAuth } from "@/server/auth/guards";
import { NextResponse } from "next/server";


export const runtime = "nodejs";

export async function GET() {
    const auth = await requireAuth();

    if (!auth.ok) {
        return auth.response;
    }

    const response: AuthSessionResponseDto = {
        user: {
            id: auth.session.userId,
            email: auth.session.email,
            roles: auth.session.roles,
            activeRole: auth.session.activeRole,
            mustChangePassword: auth.session.mustChangePassword,
            sessionVersion: auth.session.sessionVersion,
            issuedAt: auth.session.issuedAt,
            expiresAt: auth.session.expiresAt,
        },
    };

    return NextResponse.json(response);
}