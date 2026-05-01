import { getSuperManagedUser, resetSuperManagedUserPassword, setSuperManagedUserActiveStatus, SuperServiceError, } from "@/server/domains/super/service";
import { handleSuperRouteError, parseNumericId, requireSuperSession } from "@/app/api/super/_utils";
import { resetManagedUserPasswordSchema } from "@/shared/schemas/super/password-reset.schema";
import { updateAdminUserStatusSchema } from "@/shared/schemas/super/admin-user.schema";
import { buildRedirectUrl } from "@/server/http/request-origin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        userId: string;
    }>;
};

function normalizeFormValue(value: FormDataEntryValue | null): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

async function readPayload(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return {
            methodOverride: null,
            payload: await request.json(),
            acceptsHtml: false,
        };
    }

    const formData = await request.formData();

    return {
        methodOverride: normalizeFormValue(formData.get("_method")),
        acceptsHtml: (request.headers.get("accept") ?? "").includes("text/html"),
        payload: {
            isActive:
                normalizeFormValue(formData.get("isActive")) === null
                    ? undefined
                    : normalizeFormValue(formData.get("isActive")) === "true",
            newPassword: normalizeFormValue(formData.get("newPassword")),
        },
    };
}

function buildUserDetailRedirectWithError(
    request: NextRequest,
    userId: number,
    message: string,
) {
    return NextResponse.redirect(
        buildRedirectUrl(
            request,
            `/super/users/${userId}?error=${encodeURIComponent(message)}`,
        ),
        303,
    );
}

function buildValidationResponse(
    error: z.ZodError,
    request: NextRequest,
    userId: number,
    acceptsHtml: boolean,
) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message ?? "Datos inválidos.";

    if (acceptsHtml) {
        return buildUserDetailRedirectWithError(request, userId, message);
    }

    return NextResponse.json(
        {
            error: message,
            details: error.flatten(),
        },
        { status: 400 },
    );
}

function buildPostRouteErrorResponse(
    error: unknown,
    request: NextRequest,
    userId: number,
    acceptsHtml: boolean,
) {
    if (acceptsHtml && error instanceof SuperServiceError) {
        return buildUserDetailRedirectWithError(request, userId, error.message);
    }

    return handleSuperRouteError(error);
}

export async function GET(
    _request: NextRequest,
    context: RouteContext,
) {
    const auth = await requireSuperSession();

    if (!auth.ok) {
        return auth.response;
    }

    try {
        const params = await context.params;
        const userId = parseNumericId(params.userId, "id de usuario");
        const item = await getSuperManagedUser(userId);

        return NextResponse.json({ item });
    } catch (error) {
        return handleSuperRouteError(error);
    }
}

export async function PATCH(
    request: NextRequest,
    context: RouteContext,
) {
    const auth = await requireSuperSession();

    if (!auth.ok) {
        return auth.response;
    }

    try {
        const params = await context.params;
        const userId = parseNumericId(params.userId, "id de usuario");
        const json = await request.json();

        const hasIsActive = Object.prototype.hasOwnProperty.call(json, "isActive");
        const hasNewPassword = Object.prototype.hasOwnProperty.call(json, "newPassword");

        if (hasIsActive && hasNewPassword) {
            throw new SuperServiceError(
                "No puedes actualizar estado y contraseña en la misma petición.",
                400,
            );
        }

        if (!hasIsActive && !hasNewPassword) {
            throw new SuperServiceError(
                "La petición debe incluir isActive o newPassword.",
                400,
            );
        }

        if (hasIsActive) {
            const parsed = updateAdminUserStatusSchema.safeParse(json);

            if (!parsed.success) {
                return NextResponse.json(
                    {
                        error: "Datos inválidos.",
                        details: parsed.error.flatten(),
                    },
                    { status: 400 },
                );
            }

            const item = await setSuperManagedUserActiveStatus(userId, parsed.data);

            return NextResponse.json({ item });
        }

        const parsed = resetManagedUserPasswordSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos.",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const item = await resetSuperManagedUserPassword(userId, parsed.data);

        return NextResponse.json({ item });
    } catch (error) {
        return handleSuperRouteError(error);
    }
}

export async function POST(
    request: NextRequest,
    context: RouteContext,
) {
    const auth = await requireSuperSession();

    if (!auth.ok) {
        return auth.response;
    }

    const params = await context.params;
    const userId = parseNumericId(params.userId, "id de usuario");

    const { methodOverride, payload, acceptsHtml } = await readPayload(request);

    try {
        if (methodOverride !== "PATCH") {
            throw new SuperServiceError("Método no soportado.", 405);
        }

        const hasIsActive = payload.isActive !== undefined;
        const hasNewPassword =
            typeof payload.newPassword === "string" && payload.newPassword.length > 0;

        if (hasIsActive && hasNewPassword) {
            throw new SuperServiceError(
                "No puedes actualizar estado y contraseña en la misma petición.",
                400,
            );
        }

        if (!hasIsActive && !hasNewPassword) {
            throw new SuperServiceError(
                "La petición debe incluir isActive o newPassword.",
                400,
            );
        }

        if (hasIsActive) {
            const parsed = updateAdminUserStatusSchema.safeParse({
                isActive: payload.isActive,
            });

            if (!parsed.success) {
                return buildValidationResponse(parsed.error, request, userId, acceptsHtml);
            }

            const item = await setSuperManagedUserActiveStatus(userId, parsed.data);

            if (acceptsHtml) {
                return NextResponse.redirect(
                    buildRedirectUrl(request, `/super/users/${item.id}`),
                    303,
                );
            }

            return NextResponse.json({ item });
        }

        const parsed = resetManagedUserPasswordSchema.safeParse({
            newPassword: payload.newPassword,
        });

        if (!parsed.success) {
            return buildValidationResponse(parsed.error, request, userId, acceptsHtml);
        }

        const item = await resetSuperManagedUserPassword(userId, parsed.data);

        if (acceptsHtml) {
            return NextResponse.redirect(
                buildRedirectUrl(request, `/super/users/${item.id}`),
                303,
            );
        }

        return NextResponse.json({ item });
    } catch (error) {
        return buildPostRouteErrorResponse(error, request, userId, acceptsHtml);
    }
}