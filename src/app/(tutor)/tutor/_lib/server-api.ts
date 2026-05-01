import { cookies, headers } from "next/headers";

function buildBaseUrl(params: {
    host: string;
    forwardedHost: string | null;
    forwardedProto: string | null;
}) {
    const resolvedHost = params.forwardedHost ?? params.host;

    const protocol =
        params.forwardedProto ??
        (resolvedHost.includes("localhost") || resolvedHost.includes("127.0.0.1")
            ? "http"
            : "https");

    return `${protocol}://${resolvedHost}`;
}

export async function tutorServerFetch(path: string, init?: RequestInit) {
    const cookieStore = await cookies();
    const headerStore = await headers();

    const host = headerStore.get("host") ?? "localhost:3000";
    const forwardedHost = headerStore.get("x-forwarded-host");
    const forwardedProto = headerStore.get("x-forwarded-proto");

    const baseUrl = buildBaseUrl({
        host,
        forwardedHost,
        forwardedProto,
    });

    return fetch(`${baseUrl}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
            ...(init?.headers ?? {}),
            cookie: cookieStore.toString(),
        },
    });
}
