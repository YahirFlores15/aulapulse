import { resolvePreferredActiveRole } from "@/shared/lib/auth-routing";
import { getAuthUserSnapshot } from "@/server/auth/repo";
import { roleSchema } from "@/shared/enums/roles";
import { cookies } from "next/headers";
import crypto from "node:crypto";

import type { SessionTokenPayload, ValidatedSession } from "./types";


const SESSION_COOKIE_NAME = "ap_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSecret() {
    return process.env.SESSION_SECRET ?? "ap_dev_secret_change_this_please";
}

function shouldUseSecureCookie() {
    return process.env.NODE_ENV === "production";
}

function getNowEpochSeconds() {
    return Math.floor(Date.now() / 1000);
}

function isSessionTokenPayload(value: unknown): value is SessionTokenPayload {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<SessionTokenPayload>;

    if (typeof candidate.userId !== "number") return false;
    if (typeof candidate.email !== "string") return false;
    if (!Array.isArray(candidate.roles)) return false;
    if (!candidate.roles.every((role) => roleSchema.safeParse(role).success)) return false;
    if (!roleSchema.safeParse(candidate.activeRole).success) return false;
    if (typeof candidate.sessionVersion !== "number") return false;
    if (typeof candidate.issuedAt !== "number") return false;
    if (typeof candidate.expiresAt !== "number") return false;

    return true;
}

function encode(payload: SessionTokenPayload) {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json, "utf8").toString("base64url");
    const signature = crypto
        .createHmac("sha256", getSecret())
        .update(data)
        .digest("base64url");

    return `${data}.${signature}`;
}

function safeCompare(a: string, b: string) {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (aBuffer.length !== bBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function decode(token: string): SessionTokenPayload | null {
    const [data, signature] = token.split(".");

    if (!data || !signature) {
        return null;
    }

    const expectedSignature = crypto
        .createHmac("sha256", getSecret())
        .update(data)
        .digest("base64url");

    if (!safeCompare(signature, expectedSignature)) {
        return null;
    }

    try {
        const json = Buffer.from(data, "base64url").toString("utf8");
        const parsed = JSON.parse(json) as unknown;

        if (!isSessionTokenPayload(parsed)) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function isExpired(payload: SessionTokenPayload) {
    return payload.expiresAt <= getNowEpochSeconds();
}

async function setSessionCookie(payload: SessionTokenPayload) {
    const cookieStore = await cookies();
    const token = encode(payload);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookie(),
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
    });
}

export function resolveSessionActiveRole(params: {
    roles: SessionTokenPayload["roles"];
    requestedActiveRole?: SessionTokenPayload["activeRole"] | null;
    lastActiveRole?: SessionTokenPayload["activeRole"] | null;
}) {
    const resolved = resolvePreferredActiveRole(
        params.roles,
        params.requestedActiveRole ?? params.lastActiveRole ?? null,
    );

    if (!resolved) {
        throw new Error("No se puede crear una sesión sin roles asignados.");
    }

    return resolved;
}

export async function createSession(payload: {
    userId: number;
    email: string;
    roles: SessionTokenPayload["roles"];
    activeRole?: SessionTokenPayload["activeRole"] | null;
    lastActiveRole?: SessionTokenPayload["activeRole"] | null;
    sessionVersion: number;
}) {
    const now = getNowEpochSeconds();
    const activeRole = resolveSessionActiveRole({
        roles: payload.roles,
        requestedActiveRole: payload.activeRole,
        lastActiveRole: payload.lastActiveRole,
    });

    await setSessionCookie({
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles,
        activeRole,
        sessionVersion: payload.sessionVersion,
        issuedAt: now,
        expiresAt: now + SESSION_DURATION_SECONDS,
    });
}

export async function clearSession() {
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookie(),
        path: "/",
        maxAge: 0,
    });
}

export async function getSessionTokenPayload(): Promise<SessionTokenPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return decode(token);
}

export async function getValidatedSession(): Promise<ValidatedSession | null> {
    const payload = await getSessionTokenPayload();

    if (!payload) {
        return null;
    }

    if (isExpired(payload)) {
        return null;
    }

    const authUser = getAuthUserSnapshot(payload.userId);

    if (!authUser) {
        return null;
    }

    if (!authUser.isActive) {
        return null;
    }

    if (authUser.sessionVersion !== payload.sessionVersion) {
        return null;
    }

    if (!authUser.roles.includes(payload.activeRole)) {
        return null;
    }

    return {
        userId: authUser.id,
        email: authUser.email,
        roles: authUser.roles,
        activeRole: payload.activeRole,
        sessionVersion: authUser.sessionVersion,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt,
        isActive: true,
        mustChangePassword: authUser.mustChangePassword,
    };
}

/**
 * Compatibilidad temporal para no romper imports viejos.
 */
export async function getSession() {
    return getValidatedSession();
}

export const SESSION_CONFIG = {
    COOKIE_NAME: SESSION_COOKIE_NAME,
    DURATION_SECONDS: SESSION_DURATION_SECONDS,
};
