"use client";

import type {
    GradeEntryDto,
    StudentFinalGradeDto,
} from "@/shared/dtos/teacher/grade-capture.dto";
import type { TeacherCourseStudentDto } from "@/shared/dtos/teacher/courses.dto";
import type { GradeUnitDto } from "@/shared/dtos/teacher/grade-units.dto";

type FinalGradeSummaryProps = {
    students: TeacherCourseStudentDto[];
    units: GradeUnitDto[];
    entries: GradeEntryDto[];
    summary: StudentFinalGradeDto[];
};

function formatScore(value: number | null) {
    if (value === null) {
        return "Pendiente";
    }

    return value.toFixed(2);
}

function getFinalStatusLabel(summary: StudentFinalGradeDto | null) {
    if (!summary || summary.finalScore === null) {
        return "Pendiente";
    }

    if (!summary.isComplete) {
        return "Incompleto";
    }

    if (summary.finalScore < 80) {
        return "Riesgo";
    }

    if (summary.finalScore <= 85) {
        return "Atención";
    }

    return "Completo";
}

function getFinalStatusClassName(status: string) {
    if (status === "Completo") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "Atención" || status === "Incompleto") {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (status === "Riesgo") {
        return "border-rose-200 bg-rose-50 text-rose-800";
    }

    return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export function FinalGradeSummary({
    students,
    units,
    entries,
    summary,
}: FinalGradeSummaryProps) {
    const entryMap = new Map<string, number>();

    for (const entry of entries) {
        entryMap.set(`${entry.studentId}:${entry.gradeUnitId}`, entry.score);
    }

    const summaryMap = new Map<number, StudentFinalGradeDto>(
        summary.map((item) => [item.studentId, item]),
    );

    const totals = students.reduce(
        (acc, student) => {
            const studentSummary = summaryMap.get(student.studentId) ?? null;
            const status = getFinalStatusLabel(studentSummary);

            if (status === "Completo") acc.complete += 1;
            if (status === "Incompleto") acc.incomplete += 1;
            if (status === "Riesgo") acc.risk += 1;
            if (status === "Atención") acc.warning += 1;
            if (status === "Pendiente") acc.pending += 1;

            return acc;
        },
        {
            complete: 0,
            incomplete: 0,
            risk: 0,
            warning: 0,
            pending: 0,
        },
    );

    return (
        <section className="ap-panel p-6">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                    <p className="ap-eyebrow">Resumen final</p>

                    <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Resumen final por alumno
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        Promedio ponderado calculado con base en las unidades configuradas
                        del curso. Si faltan unidades por capturar, el estado queda incompleto.
                    </p>
                </div>

                <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                        Estado general
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            Completos: {totals.complete}
                        </span>

                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                            Atención: {totals.warning + totals.incomplete}
                        </span>

                        <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
                            Riesgo: {totals.risk}
                        </span>

                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                            Pendientes: {totals.pending}
                        </span>
                    </div>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Este curso no tiene alumnos asignados.
                </div>
            ) : units.length === 0 ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Todavía no hay unidades configuradas, así que no existe promedio final
                    que mostrar. La matemática, tan caprichosa con sus requisitos.
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">No. control</th>
                                <th className="px-4 py-3 font-semibold">Alumno</th>

                                {units.map((unit) => (
                                    <th
                                        key={unit.id}
                                        className="px-4 py-3 font-semibold"
                                    >
                                        {unit.sortOrder}. {unit.name}
                                    </th>
                                ))}

                                <th className="px-4 py-3 font-semibold">Final</th>
                                <th className="px-4 py-3 font-semibold">Estado</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => {
                                const studentSummary =
                                    summaryMap.get(student.studentId) ?? null;
                                const status = getFinalStatusLabel(studentSummary);

                                return (
                                    <tr
                                        key={student.studentId}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {student.controlNumber}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {student.fullName}
                                        </td>

                                        {units.map((unit) => {
                                            const score =
                                                entryMap.get(
                                                    `${student.studentId}:${unit.id}`,
                                                ) ?? null;

                                            return (
                                                <td
                                                    key={unit.id}
                                                    className="px-4 py-3 text-[var(--color-text)]"
                                                >
                                                    {score === null
                                                        ? "—"
                                                        : score.toFixed(2)}
                                                </td>
                                            );
                                        })}

                                        <td className="px-4 py-3 font-semibold text-[var(--color-text)]">
                                            {formatScore(studentSummary?.finalScore ?? null)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getFinalStatusClassName(
                                                    status,
                                                )}`}
                                            >
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}