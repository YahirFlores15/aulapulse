import { studentTrafficLightCauseSchema } from "@/shared/schemas/risk/student-traffic-light.schema";
import { trafficLightSchema } from "@/shared/enums/traffic-light";
import { z } from "zod";


export const studentRiskSubjectSchema = z.object({
    courseId: z.number().int().positive().nullable(),
    subjectId: z.number().int().positive().nullable(),
    subjectCode: z.string().trim().min(1),
    subjectName: z.string().trim().min(1),
    teacherUserId: z.number().int().positive().nullable(),
    teacherName: z.string().trim().min(1).nullable(),
    riskStatus: trafficLightSchema.nullable(),
    isIncomplete: z.boolean(),
});

export const studentRiskSummarySchema = z.object({
    studentId: z.number().int().positive(),
    controlNumber: z.string().trim().min(1),
    fullName: z.string().trim().min(1),
    groupId: z.number().int().positive(),
    groupCode: z.string().trim().min(1),
    cycleId: z.number().int().positive(),
    trafficLight: trafficLightSchema.nullable(),
    trafficLightCauses: z.array(studentTrafficLightCauseSchema),
    trafficLightCalculatedAt: z.string().trim().min(1).nullable(),
    subjects: z.array(studentRiskSubjectSchema),
});

export type StudentRiskSubjectInput = z.infer<typeof studentRiskSubjectSchema>;
export type StudentRiskSummaryInput = z.infer<typeof studentRiskSummarySchema>;