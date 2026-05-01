import {
    RiskServiceError,
    calculateAndPersistStudentTrafficLight,
} from "@/server/domains/risk/service";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const routeParamsSchema = z.object({
    studentId: z.coerce.number().int().positive("studentId debe ser un entero positivo."),
});

type RouteContext = {
    params: Promise<{
        studentId: string;
    }>;
};

function handleRiskApiError(error: unknown) {
    if (error instanceof RiskServiceError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status },
        );
    }

    if (error instanceof z.ZodError) {
        return NextResponse.json(
            {
                error: "Parámetros inválidos.",
                issues: error.issues,
            },
            { status: 400 },
        );
    }

    console.error("[RISK_STUDENT_RECALCULATE_API_ERROR]", error);

    return NextResponse.json(
        { error: "Error interno del servidor." },
        { status: 500 },
    );
}

export async function POST(_request: Request, context: RouteContext) {
    try {
        const auth = await requireAnyRole([
            ROLE.DIRECTOR,
            ROLE.TEACHER,
            ROLE.TUTOR,
        ]);

        if (!auth.ok) {
            return auth.response;
        }

        const params = await context.params;
        const parsedParams = routeParamsSchema.parse(params);

        const snapshot = calculateAndPersistStudentTrafficLight(
            parsedParams.studentId,
        );

        return NextResponse.json({
            ok: true,
            data: {
                snapshot,
            },
            message: "Semáforo general recalculado correctamente.",
        });
    } catch (error) {
        return handleRiskApiError(error);
    }
}