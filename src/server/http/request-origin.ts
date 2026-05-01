export function getRequestOrigin(request: Request): string {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = request.headers.get("host");

    if (forwardedHost) {
        return `${forwardedProto ?? "https"}://${forwardedHost}`;
    }

    if (host) {
        const protocol = host.includes("localhost") || host.includes("127.0.0.1")
            ? "http"
            : "https";

        return `${protocol}://${host}`;
    }

    return new URL(request.url).origin;
}

export function buildRedirectUrl(request: Request, path: string): URL {
    return new URL(path, getRequestOrigin(request));
}
