"use client";

import { useEffect, useMemo, useState } from "react";

type Subject = {
    id: number;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

type CreateSubjectForm = {
    code: string;
    name: string;
};

const initialForm: CreateSubjectForm = {
    code: "",
    name: "",
};

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="ap-panel-muted p-5 text-sm">
            <p className="font-semibold text-[var(--color-text)]">{title}</p>
            <p className="mt-2 leading-6 text-[var(--color-text-soft)]">
                {description}
            </p>
        </div>
    );
}

export default function DirectorSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [form, setForm] = useState<CreateSubjectForm>(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadSubjects() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/director/subjects", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar las materias");
            }

            setSubjects(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar materias");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadSubjects();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/director/subjects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code: form.code.trim().toUpperCase(),
                    name: form.name.trim(),
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo crear la materia");
            }

            setForm(initialForm);
            setSuccess("Materia creada correctamente.");
            await loadSubjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear materia");
        } finally {
            setSaving(false);
        }
    }

    const sortedSubjects = useMemo(() => {
        return [...subjects].sort((a, b) => a.code.localeCompare(b.code));
    }, [subjects]);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Materias</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                            Catálogo de materias
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Administra las materias disponibles para formar cursos. Mantener este
                            catálogo limpio evita duplicados, nombres raros y combinaciones
                            académicas que luego nadie quiere explicar en una junta.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <span className="ap-badge ap-badge-brand">
                            Materias registradas: {subjects.length}
                        </span>

                        <span className="ap-badge ap-badge-neutral">
                            Uso: cursos por grupo
                        </span>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Crear materia
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Usa códigos cortos y nombres claros. Ejemplo: MAT101, Inglés I,
                        Programación Web.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="ap-field">
                            <label className="ap-label">Código</label>
                            <input
                                className="ap-input uppercase"
                                value={form.code}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        code: event.target.value,
                                    }))
                                }
                                placeholder="MAT101"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Nombre</label>
                            <input
                                className="ap-input"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="Matemáticas aplicadas"
                                required
                            />
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4 text-sm leading-6 text-[var(--color-text-soft)]">
                            El código debe identificar la materia sin depender del docente o grupo.
                            Si el código cambia cada semana, no es catálogo, es improvisación con
                            interfaz.
                        </div>

                        <div className="space-y-3">
                            {error ? (
                                <div className="ap-message ap-message-error">{error}</div>
                            ) : null}

                            {success ? (
                                <div className="ap-message ap-message-success">
                                    {success}
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="ap-button-primary"
                        >
                            {saving ? "Guardando..." : "Crear materia"}
                        </button>
                    </form>
                </div>

                <div className="ap-panel p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="ap-eyebrow">Listado</p>

                            <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                                Materias disponibles
                            </h3>

                            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                Consulta el catálogo que después se usa para configurar cursos.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadSubjects()}
                            className="ap-button-secondary"
                        >
                            Recargar
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-[var(--color-text-soft)]">
                            Cargando materias...
                        </p>
                    ) : sortedSubjects.length === 0 ? (
                        <EmptyState
                            title="Aún no hay materias registradas"
                            description="Crea materias antes de configurar cursos. Sin materias, los cursos quedan como cascarón bonito y vacío."
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {sortedSubjects.map((subject) => (
                                <article
                                    key={subject.id}
                                    className="rounded-3xl border border-[var(--color-border)] bg-white/75 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                                                {subject.code}
                                            </span>

                                            <h4 className="mt-3 font-semibold text-[var(--color-text)]">
                                                {subject.name}
                                            </h4>

                                            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                                                Disponible para asignación de cursos
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}