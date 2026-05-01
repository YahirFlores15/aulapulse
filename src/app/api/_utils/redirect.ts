import { buildRedirectUrl } from "@/server/http/request-origin";

export function buildApiRedirectUrl(request: Request, pathname: string): URL {
    return buildRedirectUrl(request, pathname);
}

export function buildAbsoluteUrlFromRequest(request: Request, pathname: string): URL {
    return buildRedirectUrl(request, pathname);
}
