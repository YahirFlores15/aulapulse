import {
    RiskServiceError,
    recalculateStudentTrafficLightsForStudents,
} from "@/server/domains/risk/service";
import { recalculateStudentTrafficLightsSchema } from "@/shared/schemas/risk/student-traffic-light.schema";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

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
                error: "Payload inválido.",
                issues: error.issues,
            },
            { status: 400 },
        );
    }

    console.error("[RISK_STUDENTS_API_ERROR]", error);

    return NextResponse.json(
        { error: "Error interno del servidor." },
        { status: 500 },
    );
}

export async function POST(request: Request) {
    try {
        const auth = await requireAnyRole([
            ROLE.DIRECTOR,
            ROLE.TEACHER,
            ROLE.TUTOR,
        ]);

        if (!auth.ok) {
            return auth.response;
        }

        const body = await request.json();
        const input = recalculateStudentTrafficLightsSchema.parse(body);

        if (!input.studentIds || input.studentIds.length === 0) {
            return NextResponse.json(
                {
                    error: "Debes enviar studentIds para recalcular semáforos generales.",
                },
                { status: 400 },
            );
        }

        const snapshots = recalculateStudentTrafficLightsForStudents(
            input.studentIds,
        );

        return NextResponse.json({
            ok: true,
            data: {
                count: snapshots.length,
                items: snapshots,
            },
            message: "Semáforos generales recalculados correctamente.",
        });
    } catch (error) {
        return handleRiskApiError(error);
    }
}