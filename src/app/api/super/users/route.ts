import { createSuperManagedUser, listSuperManagedUsers, SuperServiceError, } from "@/server/domains/super/service";
import { handleSuperRouteError, requireSuperSession } from "@/app/api/super/_utils";
import { createAdminUserSchema } from "@/shared/schemas/super/admin-user.schema";
import { buildRedirectUrl } from "@/server/http/request-origin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


export const runtime = "nodejs";

function normalizeFormValue(value: FormDataEntryValue | null): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

async function readRequestPayload(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return await request.json();
    }

    const formData = await request.formData();

    return {
        email: normalizeFormValue(formData.get("email")),
        firstName: normalizeFormValue(formData.get("firstName")),
        lastName: normalizeFormValue(formData.get("lastName")),
        role: normalizeFormValue(formData.get("role")),
        password: normalizeFormValue(formData.get("password")),
    };
}

function wantsHtml(request: NextRequest): boolean {
    return (request.headers.get("accept") ?? "").includes("text/html");
}

function redirectToSuperUsersWithError(request: NextRequest, message: string) {
    return NextResponse.redirect(
        buildRedirectUrl(
            request,
            `/super/users?error=${encodeURIComponent(message)}`,
        ),
        303,
    );
}

function handleSuperValidationError(error: z.ZodError, request: NextRequest) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message ?? "Datos inválidos.";

    if (wantsHtml(request)) {
        return redirectToSuperUsersWithError(request, message);
    }

    return NextResponse.json(
        {
            error: message,
            details: error.flatten(),
        },
        { status: 400 },
    );
}

function handleSuperCreateError(error: unknown, request: NextRequest) {
    if (error instanceof SuperServiceError && wantsHtml(request)) {
        return redirectToSuperUsersWithError(request, error.message);
    }

    return handleSuperRouteError(error);
}

export async function GET() {
    const auth = await requireSuperSession();

    if (!auth.ok) {
        return auth.response;
    }

    try {
        const items = await listSuperManagedUsers();

        return NextResponse.json({ items });
    } catch (error) {
        return handleSuperRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperSession();

    if (!auth.ok) {
        return auth.response;
    }

    try {
        const payload = await readRequestPayload(request);
        const parsed = createAdminUserSchema.safeParse(payload);

        if (!parsed.success) {
            return handleSuperValidationError(parsed.error, request);
        }

        const item = await createSuperManagedUser(parsed.data);

        if (wantsHtml(request)) {
            return NextResponse.redirect(
                buildRedirectUrl(
                    request,
                    `/super/users?success=${encodeURIComponent("Cuenta creada correctamente.")}`,
                ),
                303,
            );
        }

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        return handleSuperCreateError(error, request);
    }
}