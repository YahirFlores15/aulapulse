"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { FinalGradeSummary } from "./_components/final-grade-summary";
import { GradeCaptureTable } from "./_components/grade-capture-table";
import { GradeUnitsForm } from "./_components/grade-units-form";

import type { CourseGradesByUnitResponseDto } from "@/shared/dtos/teacher/grade-capture.dto";
import type { TeacherCourseStudentsResponseDto } from "@/shared/dtos/teacher/courses.dto";
import type { GradeUnitsResponseDto } from "@/shared/dtos/teacher/grade-units.dto";


type GradesPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

type DraftGradeUnit = {
    id: string;
    name: string;
    sortOrder: number;
    weightPercentage: string;
};

type ScoresMap = Record<number, string>;

function parseCourseId(rawCourseId: string) {
    const parsed = Number(rawCourseId);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function createEmptyDraftUnit(order = 1): DraftGradeUnit {
    return {
        id: crypto.randomUUID(),
        name: "",
        sortOrder: order,
        weightPercentage: "",
    };
}

function mapUnitsToDraft(
    units: GradeUnitsResponseDto["units"],
): DraftGradeUnit[] {
    if (units.length === 0) {
        return [createEmptyDraftUnit(1)];
    }

    return units.map((unit) => ({
        id: String(unit.id),
        name: unit.name,
        sortOrder: unit.sortOrder,
        weightPercentage: String(unit.weightPercentage),
    }));
}

function buildScoresForUnit(
    students: TeacherCourseStudentsResponseDto["students"],
    entries: CourseGradesByUnitResponseDto["entries"],
    unitId: number | null,
): ScoresMap {
    const nextScores: ScoresMap = {};

    for (const student of students) {
        nextScores[student.studentId] = "";
    }

    if (!unitId) {
        return nextScores;
    }

    for (const entry of entries) {
        if (entry.gradeUnitId === unitId) {
            nextScores[entry.studentId] = String(entry.score);
        }
    }

    return nextScores;
}

function validateScoreInput(value: string): string | null {
    const trimmed = value.trim();

    if (trimmed === "") {
        return null;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
        return "Todas las calificaciones deben ser numéricas.";
    }

    if (parsed < 0) {
        return "La calificación no puede ser menor a 0.";
    }

    if (parsed > 100) {
        return "La calificación no puede ser mayor a 100.";
    }

    return null;
}

function getUnitsDraftTotal(units: DraftGradeUnit[]) {
    return units.reduce((sum, unit) => {
        const parsed = Number(unit.weightPercentage);

        if (!Number.isFinite(parsed)) {
            return sum;
        }

        return sum + parsed;
    }, 0);
}

export default function TeacherGradesPage({ params }: GradesPageProps) {
    const { courseId: rawCourseId } = use(params);
    const courseId = parseCourseId(rawCourseId);

    const [courseData, setCourseData] =
        useState<TeacherCourseStudentsResponseDto | null>(null);
    const [gradeData, setGradeData] =
        useState<CourseGradesByUnitResponseDto | null>(null);
    const [unitsDraft, setUnitsDraft] = useState<DraftGradeUnit[]>([
        createEmptyDraftUnit(1),
    ]);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [scores, setScores] = useState<ScoresMap>({});
    const [loading, setLoading] = useState(true);
    const [savingUnits, setSavingUnits] = useState(false);
    const [savingGrades, setSavingGrades] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUnitsLocked, setIsUnitsLocked] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!courseId) {
                setError("El curso es inválido.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [studentsResponse, unitsResponse, gradesResponse] =
                    await Promise.all([
                        fetch(`/api/teacher/courses/${courseId}/students`, {
                            cache: "no-store",
                        }),
                        fetch(`/api/teacher/courses/${courseId}/grade-units`, {
                            cache: "no-store",
                        }),
                        fetch(`/api/teacher/courses/${courseId}/grades`, {
                            cache: "no-store",
                        }),
                    ]);

                const studentsJson = await studentsResponse.json();
                const unitsJson = await unitsResponse.json();
                const gradesJson = await gradesResponse.json();

                if (!studentsResponse.ok) {
                    throw new Error(
                        studentsJson.error ?? "No se pudo cargar el curso.",
                    );
                }

                if (!unitsResponse.ok) {
                    throw new Error(
                        unitsJson.error ??
                        "No se pudieron cargar las unidades de evaluación.",
                    );
                }

                if (!gradesResponse.ok) {
                    throw new Error(
                        gradesJson.error ??
                        "No se pudieron cargar las calificaciones.",
                    );
                }

                const nextCourseData =
                    studentsJson.data as TeacherCourseStudentsResponseDto;
                const nextUnitsData = unitsJson.data as GradeUnitsResponseDto;
                const nextGradeData =
                    gradesJson.data as CourseGradesByUnitResponseDto;

                setCourseData(nextCourseData);
                setUnitsDraft(mapUnitsToDraft(nextUnitsData.units));
                setGradeData(nextGradeData);
                setIsUnitsLocked(nextUnitsData.units.length > 0);

                const initialUnitId =
                    nextUnitsData.units.length > 0 ? nextUnitsData.units[0].id : null;

                setSelectedUnitId(initialUnitId);
                setScores(
                    buildScoresForUnit(
                        nextCourseData.students,
                        nextGradeData.entries,
                        initialUnitId,
                    ),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Error al cargar calificaciones.",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadData();
    }, [courseId]);

    const canRenderCapture = useMemo(() => {
        return Boolean(courseData && gradeData);
    }, [courseData, gradeData]);

    const unitsDraftTotal = useMemo(
        () => Number(getUnitsDraftTotal(unitsDraft).toFixed(2)),
        [unitsDraft],
    );

    function handleAddUnit() {
        if (isUnitsLocked) {
            return;
        }

        setUnitsDraft((prev) => [
            ...prev,
            createEmptyDraftUnit(prev.length + 1),
        ]);
    }

    function handleRemoveUnit(id: string) {
        if (isUnitsLocked) {
            return;
        }

        setUnitsDraft((prev) => {
            if (prev.length === 1) {
                return prev;
            }

            return prev.filter((unit) => unit.id !== id);
        });
    }

    function handleChangeUnit(
        id: string,
        field: "name" | "sortOrder" | "weightPercentage",
        value: string,
    ) {
        if (isUnitsLocked) {
            return;
        }

        setUnitsDraft((prev) =>
            prev.map((unit) => {
                if (unit.id !== id) {
                    return unit;
                }

                if (field === "sortOrder") {
                    return {
                        ...unit,
                        sortOrder: Math.max(1, Number(value) || 1),
                    };
                }

                if (field === "weightPercentage") {
                    return {
                        ...unit,
                        weightPercentage: value,
                    };
                }

                return {
                    ...unit,
                    name: value,
                };
            }),
        );
    }

    async function reloadGradesState(preferredUnitId?: number | null) {
        if (!courseId || !courseData) {
            return;
        }

        const response = await fetch(`/api/teacher/courses/${courseId}/grades`, {
            cache: "no-store",
        });
        const json = await response.json();

        if (!response.ok) {
            throw new Error(
                json.error ?? "No se pudieron recargar las calificaciones.",
            );
        }

        const nextGradeData = json.data as CourseGradesByUnitResponseDto;
        setGradeData(nextGradeData);

        const fallbackUnitId =
            nextGradeData.units.length > 0 ? nextGradeData.units[0].id : null;

        const resolvedUnitId =
            preferredUnitId && nextGradeData.units.some((unit) => unit.id === preferredUnitId)
                ? preferredUnitId
                : fallbackUnitId;

        setSelectedUnitId(resolvedUnitId);
        setScores(
            buildScoresForUnit(
                courseData.students,
                nextGradeData.entries,
                resolvedUnitId,
            ),
        );
    }

    async function handleSaveUnits() {
        if (!courseId || isUnitsLocked) {
            return;
        }

        setSavingUnits(true);
        setError(null);
        setMessage(null);

        try {
            const payload = {
                units: unitsDraft.map((unit) => ({
                    name: unit.name.trim(),
                    sortOrder: unit.sortOrder,
                    weightPercentage:
                        unit.weightPercentage.trim() === ""
                            ? 0
                            : Number(unit.weightPercentage),
                })),
            };

            const response = await fetch(
                `/api/teacher/courses/${courseId}/grade-units`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.error ??
                    "No se pudo guardar la configuración de unidades.",
                );
            }

            const nextUnitsData = json.data as GradeUnitsResponseDto;
            setUnitsDraft(mapUnitsToDraft(nextUnitsData.units));
            setIsUnitsLocked(nextUnitsData.units.length > 0);

            const nextSelectedUnitId =
                nextUnitsData.units.length > 0 ? nextUnitsData.units[0].id : null;

            await reloadGradesState(nextSelectedUnitId);
            setMessage("Unidades de evaluación guardadas correctamente. La configuración quedó bloqueada.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al guardar la configuración.",
            );
        } finally {
            setSavingUnits(false);
        }
    }

    function handleSelectUnit(unitId: number) {
        if (!courseData || !gradeData) {
            return;
        }

        setSelectedUnitId(unitId);
        setScores(buildScoresForUnit(courseData.students, gradeData.entries, unitId));
        setMessage(null);
        setError(null);
    }

    function handleScoreChange(studentId: number, value: string) {
        const trimmed = value.trim();

        if (trimmed === "") {
            setScores((prev) => ({
                ...prev,
                [studentId]: "",
            }));
            return;
        }

        const parsed = Number(trimmed);

        if (!Number.isFinite(parsed)) {
            return;
        }

        const normalized = Math.max(0, Math.min(100, parsed));

        setScores((prev) => ({
            ...prev,
            [studentId]: String(normalized),
        }));
    }

    async function handleSaveGrades() {
        if (!courseId || !courseData || !selectedUnitId) {
            return;
        }

        setSavingGrades(true);
        setError(null);
        setMessage(null);

        try {
            for (const student of courseData.students) {
                const rawValue = scores[student.studentId] ?? "";
                const validationError = validateScoreInput(rawValue);

                if (validationError) {
                    throw new Error(validationError);
                }
            }

            const payload = {
                unitId: selectedUnitId,
                records: courseData.students.map((student) => ({
                    studentId: student.studentId,
                    score:
                        scores[student.studentId]?.trim() === ""
                            ? 0
                            : Number(scores[student.studentId]),
                })),
            };

            const response = await fetch(`/api/teacher/courses/${courseId}/grades`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.error ?? "No se pudieron guardar las calificaciones.",
                );
            }

            const nextGradeData = json.data as CourseGradesByUnitResponseDto;
            setGradeData(nextGradeData);
            setScores(
                buildScoresForUnit(
                    courseData.students,
                    nextGradeData.entries,
                    selectedUnitId,
                ),
            );
            setMessage("Calificaciones guardadas correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al guardar las calificaciones.",
            );
        } finally {
            setSavingGrades(false);
        }
    }

    if (loading) {
        return (
            <div className="ap-panel p-6">
                <p className="text-sm text-[var(--color-text-soft)]">
                    Cargando calificaciones...
                </p>
            </div>
        );
    }

    if (error && !courseData) {
        return (
            <div className="space-y-4">
                <Link
                    href="/teacher/courses"
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver a cursos
                </Link>

                <div className="ap-message ap-message-error">{error}</div>
            </div>
        );
    }

    if (!courseData || !gradeData || !courseId) {
        return null;
    }

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <Link
                    href={`/teacher/courses/${courseId}`}
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver al curso
                </Link>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <p className="ap-eyebrow">Calificaciones</p>

                        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                            {courseData.course.subjectCode} · {courseData.course.subjectName}
                        </h1>

                        <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                            Grupo: {courseData.course.groupCode} · {courseData.course.groupName}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5 text-sm text-[var(--color-text-soft)]">
                        <p className="font-semibold text-[var(--color-text)]">
                            Regla de evaluación
                        </p>

                        <p className="mt-2 leading-6">
                            Las unidades deben sumar exactamente 100%. Una vez guardadas, quedan
                            bloqueadas para proteger la integridad de las calificaciones.
                        </p>

                        <p className="mt-3 font-medium text-[var(--color-text)]">
                            Suma actual: {unitsDraftTotal}%
                        </p>
                    </div>
                </div>
            </section>

            {message ? (
                <div className="ap-message ap-message-success">{message}</div>
            ) : null}

            {error ? (
                <div className="ap-message ap-message-error">{error}</div>
            ) : null}

            <GradeUnitsForm
                units={unitsDraft}
                saving={savingUnits}
                isLocked={isUnitsLocked}
                onAddUnit={handleAddUnit}
                onRemoveUnit={handleRemoveUnit}
                onChangeUnit={handleChangeUnit}
                onSave={handleSaveUnits}
            />

            <GradeCaptureTable
                students={courseData.students}
                units={gradeData.units}
                selectedUnitId={selectedUnitId}
                scores={scores}
                saving={savingGrades}
                onSelectUnit={handleSelectUnit}
                onScoreChange={handleScoreChange}
                onSave={handleSaveGrades}
            />

            {canRenderCapture ? (
                <FinalGradeSummary
                    students={courseData.students}
                    units={gradeData.units}
                    entries={gradeData.entries}
                    summary={gradeData.summary}
                />
            ) : null}
        </div>
    );
}