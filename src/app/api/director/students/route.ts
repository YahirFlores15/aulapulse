import { createStudentSchema } from "@/shared/schemas/director/student.schema";
import { directorService } from "@/server/domains/director/service";
import { trafficLightSchema } from "@/shared/enums/traffic-light";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import { z } from "zod";

import { handleDirectorError } from "../_utils";


export const runtime = "nodejs";

const directorStudentsQuerySchema = z.object({
    groupId: z.coerce.number().int().positive().optional(),
    trafficLight: z
        .union([trafficLightSchema, z.literal("NONE")])
        .optional(),
});

export async function GET(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const url = new URL(request.url);
        const parsedQuery = directorStudentsQuerySchema.parse({
            groupId: url.searchParams.get("groupId") ?? undefined,
            trafficLight: url.searchParams.get("trafficLight") ?? undefined,
        });

        if (parsedQuery.groupId) {
            const students = await directorService.listStudentsByGroup(
                parsedQuery.groupId,
                {
                    trafficLight: parsedQuery.trafficLight,
                },
            );

            return NextResponse.json({ data: students });
        }

        const students = await directorService.listStudents({
            trafficLight: parsedQuery.trafficLight,
        });

        return NextResponse.json({ data: students });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Parámetros inválidos",
                    issues: error.issues,
                },
                { status: 400 },
            );
        }

        return handleDirectorError(error);
    }
}

export async function POST(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json().catch(() => null);
        const parsed = createStudentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Datos inválidos",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const student = await directorService.createStudent(parsed.data);
        return NextResponse.json({ data: student }, { status: 201 });
    } catch (error) {
        return handleDirectorError(error);
    }
}