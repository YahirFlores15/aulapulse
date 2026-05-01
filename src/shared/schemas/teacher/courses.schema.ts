import { z } from "zod";


export const teacherCourseRouteParamsSchema = z.object({
    courseId: z.coerce.number().int().positive(),
});

export const teacherCourseStudentsQuerySchema = z.object({
    includeRisk: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((value) => value === "true"),
});

export type TeacherCourseRouteParamsInput = z.infer<
    typeof teacherCourseRouteParamsSchema
>;

export type TeacherCourseStudentsQueryInput = z.infer<
    typeof teacherCourseStudentsQuerySchema
>;