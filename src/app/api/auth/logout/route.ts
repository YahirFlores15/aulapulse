import { clearSession } from "@/server/auth/session";
import { buildRedirectUrl } from "@/server/http/request-origin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
    await clearSession();

    return NextResponse.redirect(
        buildRedirectUrl(request, "/login"),
        { status: 303 },
    );
}
