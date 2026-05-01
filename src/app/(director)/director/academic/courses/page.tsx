"use client";

import { useEffect, useMemo, useState } from "react";

type Cycle = {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
    ordinal: 1 | 2 | 3;
    status: "UPCOMING" | "ACTIVE" | "CLOSED";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type Group = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
};

type Subject = {
    id: number;
    code: string;
    name: string;
};

type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "TEACHER" | "PEDAGOGIA" | "PSICOLOGIA";
    isActive: boolean;
};

type Course = {
    id: number;
    cycleId: number;
    cycleCode: string;
    groupId: number;
    groupCode: string;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    teacherUserId: number;
    teacherName: string;
    teacherEmail: string;
    createdAt: string;
    updatedAt: string;
};

type CreateCourseForm = {
    groupId: string;
    subjectId: string;
    teacherUserId: string;
};

const initialForm: CreateCourseForm = {
    groupId: "",
    subjectId: "",
    teacherUserId: "",
};

function formatDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function DirectorCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState<CreateCourseForm>(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingRefs, setLoadingRefs] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadCourses() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/director/courses", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar los cursos");
            }

            setCourses(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar cursos");
        } finally {
            setLoading(false);
        }
    }

    async function loadReferences() {
        setLoadingRefs(true);
        setError("");

        try {
            const [
                currentCycleResponse,
                groupsResponse,
                subjectsResponse,
                usersResponse,
            ] = await Promise.all([
                fetch("/api/director/cycles/current", { cache: "no-store" }),
                fetch("/api/director/groups", { cache: "no-store" }),
                fetch("/api/director/subjects", { cache: "no-store" }),
                fetch("/api/director/users", { cache: "no-store" }),
            ]);

            const [
                currentCycleJson,
                groupsJson,
                subjectsJson,
                usersJson,
            ] = await Promise.all([
                currentCycleResponse.json(),
                groupsResponse.json(),
                subjectsResponse.json(),
                usersResponse.json(),
            ]);

            if (!currentCycleResponse.ok) {
                throw new Error(
                    currentCycleJson?.error ?? "No se pudo cargar el ciclo actual",
                );
            }

            if (!groupsResponse.ok) {
                throw new Error(groupsJson?.error ?? "No se pudieron cargar los grupos");
            }

            if (!subjectsResponse.ok) {
                throw new Error(subjectsJson?.error ?? "No se pudieron cargar las materias");
            }

            if (!usersResponse.ok) {
                throw new Error(usersJson?.error ?? "No se pudieron cargar los usuarios");
            }

            setCurrentCycle(currentCycleJson.data?.currentCycle ?? null);
            setGroups(groupsJson.data ?? []);
            setSubjects(subjectsJson.data ?? []);
            setUsers(
                (usersJson.data ?? []).filter(
                    (user: User) => user.role === "TEACHER" && user.isActive,
                ),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar referencias");
        } finally {
            setLoadingRefs(false);
        }
    }

    useEffect(() => {
        void loadCourses();
        void loadReferences();
    }, []);

    const filteredGroups = useMemo(() => {
        if (!currentCycle) {
            return [];
        }

        return groups.filter((group) => group.cycleId === currentCycle.id);
    }, [groups, currentCycle]);

    const selectedGroup = useMemo(
        () => groups.find((group) => group.id === Number(form.groupId)) ?? null,
        [groups, form.groupId],
    );

    const selectedSubject = useMemo(
        () => subjects.find((subject) => subject.id === Number(form.subjectId)) ?? null,
        [subjects, form.subjectId],
    );

    const selectedTeacher = useMemo(
        () => users.find((user) => user.id === Number(form.teacherUserId)) ?? null,
        [users, form.teacherUserId],
    );

    const canCreateCourse =
        Boolean(currentCycle) &&
        filteredGroups.length > 0 &&
        subjects.length > 0 &&
        users.length > 0;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (!currentCycle) {
                throw new Error("No hay ciclo actual disponible.");
            }

            const response = await fetch("/api/director/courses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    groupId: Number(form.groupId),
                    subjectId: Number(form.subjectId),
                    teacherUserId: Number(form.teacherUserId),
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo crear el curso");
            }

            setForm(initialForm);
            setSuccess("Curso creado correctamente en el ciclo actual.");
            await loadCourses();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear curso");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Cursos</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                            Configuración de cursos
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Un curso conecta grupo, materia y docente dentro del ciclo actual.
                            El ciclo ya no se selecciona manualmente porque el sistema lo detecta
                            de forma automática según la fecha. Un milagro: quitarle decisiones
                            peligrosas al formulario.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            Ciclo operativo actual
                        </p>

                        {currentCycle ? (
                            <div className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
                                <p className="font-semibold text-[var(--color-text)]">
                                    {currentCycle.code} · {currentCycle.name}
                                </p>
                                <p>
                                    {formatDate(currentCycle.startDate)} al{" "}
                                    {formatDate(currentCycle.endDate)}
                                </p>
                                <span className="ap-badge ap-badge-brand">
                                    Usado automáticamente
                                </span>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                                No se pudo detectar el ciclo actual.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Crear curso
                    </h3>

                    <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                        Selecciona grupo, materia y docente. El ciclo actual se aplica
                        automáticamente.
                    </p>

                    {!currentCycle && !loadingRefs ? (
                        <div className="mt-5 ap-message ap-message-error">
                            No hay ciclo actual disponible. Revisa la generación automática de
                            ciclos antes de crear cursos.
                        </div>
                    ) : null}

                    {currentCycle && filteredGroups.length === 0 && !loadingRefs ? (
                        <div className="mt-5 ap-message ap-message-error">
                            No hay grupos registrados para el ciclo actual. Primero crea grupos
                            dentro de {currentCycle.code}.
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="ap-field md:col-span-2">
                            <label className="ap-label">Ciclo</label>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)]">
                                {currentCycle
                                    ? `${currentCycle.code} - ${currentCycle.name}`
                                    : "Ciclo actual no disponible"}
                            </div>
                        </div>

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
                                disabled={loadingRefs || !currentCycle || filteredGroups.length === 0}
                            >
                                <option value="">Selecciona un grupo</option>
                                {filteredGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.code} - {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Materia</label>
                            <select
                                className="ap-select"
                                value={form.subjectId}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        subjectId: event.target.value,
                                    }))
                                }
                                required
                                disabled={loadingRefs}
                            >
                                <option value="">Selecciona una materia</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.code} - {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ap-field md:col-span-2">
                            <label className="ap-label">Docente</label>
                            <select
                                className="ap-select"
                                value={form.teacherUserId}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        teacherUserId: event.target.value,
                                    }))
                                }
                                required
                                disabled={loadingRefs}
                            >
                                <option value="">Selecciona un docente</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} - {user.email}
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
                                disabled={saving || loadingRefs || !canCreateCourse}
                                className="ap-button-primary"
                            >
                                {saving ? "Guardando..." : "Crear curso"}
                            </button>
                        </div>
                    </form>
                </div>

                <aside className="ap-panel-muted p-6">
                    <p className="ap-eyebrow">Vista previa</p>

                    <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">
                        Curso seleccionado
                    </h3>

                    <div className="mt-5 space-y-3 text-sm">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">Ciclo</p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {currentCycle
                                    ? `${currentCycle.code} - ${currentCycle.name}`
                                    : "Ciclo actual no disponible"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">Grupo</p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {selectedGroup
                                    ? `${selectedGroup.code} - ${selectedGroup.name}`
                                    : "Sin seleccionar"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">Materia</p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {selectedSubject
                                    ? `${selectedSubject.code} - ${selectedSubject.name}`
                                    : "Sin seleccionar"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">Docente</p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {selectedTeacher
                                    ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                                    : "Sin seleccionar"}
                            </p>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            Listado de cursos del ciclo actual
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            {currentCycle
                                ? `${courses.length} cursos configurados en ${currentCycle.code}.`
                                : `${courses.length} cursos configurados.`}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadCourses()}
                        className="ap-button-secondary"
                    >
                        Recargar
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Cargando cursos...
                    </p>
                ) : courses.length === 0 ? (
                    <div className="ap-panel-muted p-5 text-sm text-[var(--color-text-soft)]">
                        Aún no hay cursos registrados para el ciclo actual. Crea cursos cuando
                        ya existan grupos, materias y docentes activos.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Curso
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Grupo
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Docente
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {courses.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-3 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {course.subjectCode} - {course.subjectName}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                Ciclo {course.cycleCode}
                                            </p>
                                        </td>

                                        <td className="px-3 py-4 text-[var(--color-text)]">
                                            {course.groupCode}
                                        </td>

                                        <td className="px-3 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {course.teacherName}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                {course.teacherEmail}
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