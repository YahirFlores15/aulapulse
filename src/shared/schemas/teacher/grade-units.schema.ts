import { z } from "zod";


const gradeUnitNameSchema = z
    .string()
    .trim()
    .min(1, "El nombre de la unidad es obligatorio.")
    .max(100, "El nombre de la unidad no puede exceder 100 caracteres.");

const gradeUnitSortOrderSchema = z.coerce
    .number()
    .int("El orden debe ser un entero.")
    .min(1, "El orden debe ser mayor o igual a 1.");

const gradeUnitWeightSchema = z
    .coerce
    .number()
    .min(0.01, "El porcentaje debe ser mayor a 0.")
    .max(100, "El porcentaje no puede ser mayor a 100.")
    .refine((value) => Number(value.toFixed(2)) === value, {
        message: "El porcentaje puede tener máximo 2 decimales.",
    });

export const gradeUnitInputSchema = z.object({
    name: gradeUnitNameSchema,
    sortOrder: gradeUnitSortOrderSchema,
    weightPercentage: gradeUnitWeightSchema,
});

export const replaceGradeUnitsSchema = z
    .object({
        units: z
            .array(gradeUnitInputSchema)
            .min(1, "Debes configurar al menos una unidad."),
    })
    .superRefine((value, ctx) => {
        const totalWeight = value.units.reduce(
            (sum, unit) => sum + unit.weightPercentage,
            0,
        );

        const normalizedTotal = Number(totalWeight.toFixed(2));

        if (normalizedTotal !== 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["units"],
                message: "La suma de porcentajes debe ser exactamente 100.",
            });
        }

        const seenSortOrders = new Set<number>();

        value.units.forEach((unit, index) => {
            if (seenSortOrders.has(unit.sortOrder)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["units", index, "sortOrder"],
                    message: "No puedes repetir el orden de una unidad dentro del mismo curso.",
                });
            }

            seenSortOrders.add(unit.sortOrder);
        });
    });

export type GradeUnitInput = z.infer<typeof gradeUnitInputSchema>;
export type ReplaceGradeUnitsInput = z.infer<typeof replaceGradeUnitsSchema>;