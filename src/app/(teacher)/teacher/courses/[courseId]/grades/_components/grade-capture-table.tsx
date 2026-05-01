"use client";

import type { TeacherCourseStudentDto } from "@/shared/dtos/teacher/courses.dto";
import type { GradeUnitDto } from "@/shared/dtos/teacher/grade-units.dto";

type GradeCaptureTableProps = {
    students: TeacherCourseStudentDto[];
    units: GradeUnitDto[];
    selectedUnitId: number | null;
    scores: Record<number, string>;
    saving: boolean;
    onSelectUnit: (unitId: number) => void;
    onScoreChange: (studentId: number, value: string) => void;
    onSave: () => void;
};

function getScoreStatus(value: string | undefined) {
    const trimmed = value?.trim() ?? "";

    if (trimmed === "") {
        return "Pendiente";
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
        return "Inválida";
    }

    if (parsed < 80) {
        return "Riesgo";
    }

    if (parsed <= 85) {
        return "Atención";
    }

    return "Correcta";
}

function getScoreStatusClassName(status: string) {
    if (status === "Correcta") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "Atención") {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (status === "Riesgo" || status === "Inválida") {
        return "border-rose-200 bg-rose-50 text-rose-800";
    }

    return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export function GradeCaptureTable({
    students,
    units,
    selectedUnitId,
    scores,
    saving,
    onSelectUnit,
    onScoreChange,
    onSave,
}: GradeCaptureTableProps) {
    const selectedUnit =
        units.find((unit) => unit.id === selectedUnitId) ?? null;

    const capturedCount = students.filter((student) => {
        const value = scores[student.studentId]?.trim() ?? "";
        return value !== "";
    }).length;

    return (
        <section className="ap-panel p-6">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                    <p className="ap-eyebrow">Calificaciones</p>

                    <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Captura por unidad
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        Selecciona una unidad y captura una sola calificación por alumno en
                        escala de 0 a 100. El promedio final se calcula ponderando las unidades
                        configuradas, porque aparentemente sumar cosas con porcentajes sigue
                        siendo trabajo humano asistido por software.
                    </p>
                </div>

                <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                        Avance de captura
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                            Capturados: {capturedCount}/{students.length}
                        </span>

                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                            Unidades: {units.length}
                        </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        {selectedUnit
                            ? `Unidad actual: ${selectedUnit.sortOrder}. ${selectedUnit.name}`
                            : "Selecciona una unidad para comenzar."}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="ap-field">
                    <label className="ap-label">Unidad</label>

                    <select
                        value={selectedUnitId ?? ""}
                        onChange={(event) =>
                            onSelectUnit(Number(event.target.value))
                        }
                        disabled={units.length === 0}
                        className="ap-select min-w-[260px]"
                    >
                        <option value="">Selecciona una unidad</option>

                        {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                                {unit.sortOrder}. {unit.name} ({unit.weightPercentage}%)
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving || !selectedUnit || students.length === 0}
                    className="ap-button-primary"
                >
                    {saving ? "Guardando..." : "Guardar calificaciones"}
                </button>
            </div>

            {units.length === 0 ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Primero debes configurar las unidades de evaluación del curso.
                </div>
            ) : !selectedUnit ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Selecciona una unidad para comenzar la captura.
                </div>
            ) : students.length === 0 ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Este curso no tiene alumnos asignados.
                </div>
            ) : (
                <>
                    <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white/70 px-4 py-4">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            Unidad actual: {selectedUnit.sortOrder}. {selectedUnit.name}
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            Peso: {selectedUnit.weightPercentage}%
                        </p>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">No. control</th>
                                    <th className="px-4 py-3 font-semibold">Alumno</th>
                                    <th className="px-4 py-3 font-semibold">Calificación</th>
                                    <th className="px-4 py-3 font-semibold">Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map((student) => {
                                    const scoreValue = scores[student.studentId] ?? "";
                                    const status = getScoreStatus(scoreValue);

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

                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    value={scoreValue}
                                                    onChange={(event) =>
                                                        onScoreChange(
                                                            student.studentId,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="ap-input w-36"
                                                    placeholder="0 - 100"
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getScoreStatusClassName(
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
                </>
            )}
        </section>
    );
}