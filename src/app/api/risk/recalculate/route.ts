import {
    RiskServiceError,
    recalculateCourseRiskForStudents,
} from "@/server/domains/risk/service";
import { requireAnyRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const riskRecalculateSchema = z.object({
    courseId: z.coerce.number().int().positive("courseId debe ser un entero positivo"),
    studentIds: z
        .array(z.coerce.number().int().positive("Cada studentId debe ser un entero positivo"))
        .optional(),
});

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
        const input = riskRecalculateSchema.parse(body);

        const results = recalculateCourseRiskForStudents(
            input.courseId,
            input.studentIds,
        );

        return NextResponse.json({
            ok: true,
            data: {
                courseId: input.courseId,
                count: results.length,
                items: results,
            },
            message:
                "Semáforo por materia recalculado. El semáforo general de los alumnos afectados también fue actualizado.",
        });
    } catch (error) {
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

        console.error("[RISK_RECALCULATE_API_ERROR]", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}