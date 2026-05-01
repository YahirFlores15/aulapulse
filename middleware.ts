import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";


const PUBLIC_PATHS = new Set([
    "/",
    "/login",
]);

function isPublicPath(pathname: string) {
    if (PUBLIC_PATHS.has(pathname)) return true;
    if (pathname.startsWith("/api/auth/login")) return true;
    if (pathname.startsWith("/api/auth/logout")) return true;
    if (pathname.startsWith("/api/auth/me")) return true;
    if (pathname.startsWith("/_next/")) return true;
    if (pathname === "/favicon.ico") return true;
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    const session = request.cookies.get("ap_session")?.value;

    if (!session) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};