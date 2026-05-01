"use client";

import { useEffect, useMemo, useState } from "react";

type Group = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
};

type TeacherCandidate = {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    isActive: boolean;
};

type GroupTutor = {
    id: number;
    groupId: number;
    groupCode: string;
    groupName: string;
    tutorUserId: number;
    tutorName: string;
    tutorEmail: string;
    createdAt: string;
    updatedAt: string;
};

type TutorAssignmentForm = {
    groupId: string;
    tutorUserId: string;
};

const initialTutorForm: TutorAssignmentForm = {
    groupId: "",
    tutorUserId: "",
};

export default function DirectorAssignmentsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [teachers, setTeachers] = useState<TeacherCandidate[]>([]);
    const [assignments, setAssignments] = useState<GroupTutor[]>([]);
    const [form, setForm] = useState<TutorAssignmentForm>(initialTutorForm);
    const [loadingRefs, setLoadingRefs] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadReferences() {
        setLoadingRefs(true);
        setError("");

        try {
            const [groupsResponse, teachersResponse] = await Promise.all([
                fetch("/api/director/groups", { cache: "no-store" }),
                fetch("/api/director/teacher-candidates", { cache: "no-store" }),
            ]);

            const [groupsJson, teachersJson] = await Promise.all([
                groupsResponse.json(),
                teachersResponse.json(),
            ]);

            if (!groupsResponse.ok) {
                throw new Error(groupsJson?.error ?? "No se pudieron cargar los grupos");
            }

            if (!teachersResponse.ok) {
                throw new Error(teachersJson?.error ?? "No se pudieron cargar los docentes");
            }

            setGroups(groupsJson.data ?? []);
            setTeachers(
                (teachersJson.data ?? []).filter(
                    (teacher: TeacherCandidate) => teacher.isActive,
                ),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar referencias");
        } finally {
            setLoadingRefs(false);
        }
    }

    async function loadAssignments() {
        setLoadingAssignments(true);
        setError("");

        try {
            const response = await fetch("/api/director/group-tutors", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar las asignaciones");
            }

            setAssignments(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar asignaciones");
        } finally {
            setLoadingAssignments(false);
        }
    }

    useEffect(() => {
        void loadReferences();
        void loadAssignments();
    }, []);

    const selectedGroup = useMemo(
        () => groups.find((group) => group.id === Number(form.groupId)) ?? null,
        [groups, form.groupId],
    );

    const selectedTeacher = useMemo(
        () => teachers.find((teacher) => teacher.id === Number(form.tutorUserId)) ?? null,
        [teachers, form.tutorUserId],
    );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/director/group-tutors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    groupId: Number(form.groupId),
                    tutorUserId: Number(form.tutorUserId),
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo asignar el tutor");
            }

            setForm(initialTutorForm);
            setSuccess("Docente asignado como tutor correctamente.");
            await loadAssignments();
            await loadReferences();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al asignar tutor");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Asignaciones</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                            Asignación de tutores
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Un tutor siempre es un docente con responsabilidad sobre un grupo.
                            Aquí no se crean cuentas nuevas: se toma un docente existente y el
                            sistema le habilita el rol Tutor cuando corresponde. Orden institucional,
                            ese concepto exótico.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <span className="ap-badge ap-badge-brand">
                            Docentes activos: {teachers.length}
                        </span>
                        <span className="ap-badge ap-badge-neutral">
                            Tutorías asignadas: {assignments.length}
                        </span>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Asignar docente como tutor
                    </h3>

                    <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                        Selecciona un grupo y el docente responsable. El sistema mantiene una sola
                        asignación activa por grupo.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="ap-field">
                            <label className="ap-label">Grupo</label>
                            <select
                                className="ap-select"
                                value={form.groupId}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        groupId: event.target.value,
                                    }))
                                }
                                required
                                disabled={loadingRefs}
                            >
                                <option value="">Selecciona un grupo</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.cycleCode} - {group.code} - {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Docente</label>
                            <select
                                className="ap-select"
                                value={form.tutorUserId}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        tutorUserId: event.target.value,
                                    }))
                                }
                                required
                                disabled={loadingRefs}
                            >
                                <option value="">Selecciona un docente</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.fullName} - {teacher.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            {error ? (
                                <div className="ap-message ap-message-error">{error}</div>
                            ) : null}

                            {success ? (
                                <div className="ap-message ap-message-success">
                                    {success}
                                </div>
                            ) : null}
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={saving || loadingRefs}
                                className="ap-button-primary"
                            >
                                {saving ? "Guardando..." : "Asignar tutor"}
                            </button>
                        </div>
                    </form>
                </div>

                <aside className="ap-panel-muted p-6">
                    <p className="ap-eyebrow">Regla de negocio</p>

                    <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">
                        Tutor como docente
                    </h3>

                    <div className="mt-5 space-y-3 text-sm text-[var(--color-text-soft)]">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            Todo tutor debe ser docente.
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            No todo docente es tutor.
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            Al asignar un grupo, el sistema agrega el rol Tutor automáticamente.
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            Si el docente deja de tener grupos asignados, el sistema puede retirar
                            el rol Tutor.
                        </div>
                    </div>

                    <div className="mt-5 rounded-3xl border border-[var(--color-border)] bg-white/70 p-5 text-sm">
                        <p className="font-semibold text-[var(--color-text)]">
                            Vista previa
                        </p>

                        <div className="mt-3 space-y-2 text-[var(--color-text-soft)]">
                            <p>
                                Grupo:{" "}
                                <span className="font-medium text-[var(--color-text)]">
                                    {selectedGroup
                                        ? `${selectedGroup.cycleCode} - ${selectedGroup.code} - ${selectedGroup.name}`
                                        : "Sin seleccionar"}
                                </span>
                            </p>

                            <p>
                                Docente:{" "}
                                <span className="font-medium text-[var(--color-text)]">
                                    {selectedTeacher
                                        ? selectedTeacher.fullName
                                        : "Sin seleccionar"}
                                </span>
                            </p>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            Tutorías asignadas
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Consulta qué docente está a cargo de cada grupo.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadAssignments()}
                        className="ap-button-secondary"
                    >
                        Recargar
                    </button>
                </div>

                {loadingAssignments ? (
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Cargando asignaciones...
                    </p>
                ) : assignments.length === 0 ? (
                    <div className="ap-panel-muted p-5 text-sm text-[var(--color-text-soft)]">
                        Aún no hay docentes asignados como tutores. Asigna primero un docente a
                        un grupo para habilitar su modo Tutor.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Grupo
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Docente tutor
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {assignments.map((assignment) => (
                                    <tr
                                        key={assignment.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-3 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {assignment.groupCode} - {assignment.groupName}
                                            </p>
                                        </td>

                                        <td className="px-3 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {assignment.tutorName}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                {assignment.tutorEmail}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}