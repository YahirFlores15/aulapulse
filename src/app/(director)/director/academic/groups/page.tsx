"use client";

import { useEffect, useMemo, useState } from "react";

type Cycle = {
    id: number;
    code: string;
    name: string;
};

type Group = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

type CreateGroupForm = {
    code: string;
    name: string;
};

const initialForm: CreateGroupForm = {
    code: "",
    name: "",
};

function buildCycleLabel(cycle: Cycle | null) {
    if (!cycle) {
        return "Resolviendo ciclo actual...";
    }

    return `${cycle.code} · ${cycle.name}`;
}

export default function DirectorGroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
    const [form, setForm] = useState<CreateGroupForm>(initialForm);
    const [loading, setLoading] = useState(true);
    const [loadingCycle, setLoadingCycle] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadGroups() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/director/groups", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar los grupos");
            }

            setGroups(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar grupos");
        } finally {
            setLoading(false);
        }
    }

    async function loadCurrentCycle() {
        setLoadingCycle(true);

        try {
            const response = await fetch("/api/director/cycles/current", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo cargar el ciclo actual");
            }

            setCurrentCycle(json.data?.currentCycle ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar ciclo actual");
        } finally {
            setLoadingCycle(false);
        }
    }

    useEffect(() => {
        void loadGroups();
        void loadCurrentCycle();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/director/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code: form.code,
                    name: form.name,
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo crear el grupo");
            }

            setForm(initialForm);
            setSuccess("Grupo creado correctamente en el ciclo académico actual.");
            await loadGroups();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear grupo");
        } finally {
            setSaving(false);
        }
    }

    const groupsByCycle = useMemo(() => {
        return groups.reduce<Record<string, number>>((acc, group) => {
            const key = `${group.cycleCode} · ${group.cycleName}`;
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {});
    }, [groups]);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="ap-eyebrow">Grupos</p>

                        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                            Administración de grupos
                        </h2>

                        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                            Crea grupos dentro del ciclo académico actual. El ciclo se resuelve
                            automáticamente para evitar registros en periodos futuros o pasados.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                        <div className="ap-panel-muted p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                                Grupos registrados
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">
                                {groups.length}
                            </p>
                        </div>

                        <div className="ap-panel-muted p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                                Ciclo actual
                            </p>
                            <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
                                {loadingCycle ? "Cargando..." : buildCycleLabel(currentCycle)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="ap-panel p-6">
                    <p className="ap-eyebrow">Nuevo grupo</p>

                    <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Crear grupo
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        Define un código corto y escribe un nombre claro. El sistema asignará
                        el grupo al ciclo académico actual. Sí, ahora el tiempo deja de ser
                        opcional.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="ap-panel-muted px-4 py-3 text-sm text-[var(--color-text-soft)]">
                            Ciclo académico actual:{" "}
                            <span className="font-medium text-[var(--color-text)]">
                                {loadingCycle ? "Cargando..." : buildCycleLabel(currentCycle)}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="ap-field">
                                <label className="ap-label">Código</label>
                                <input
                                    className="ap-input"
                                    value={form.code}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            code: event.target.value,
                                        }))
                                    }
                                    placeholder="A"
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
                                    placeholder="Grupo A"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {error ? (
                                <div className="ap-message ap-message-error">{error}</div>
                            ) : null}

                            {success ? (
                                <div className="ap-message ap-message-success">{success}</div>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={saving || loadingCycle || !currentCycle}
                            className="ap-button-primary"
                        >
                            {saving ? "Guardando..." : "Crear grupo"}
                        </button>
                    </form>
                </div>

                <div className="ap-panel p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="ap-eyebrow">Distribución</p>

                            <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                                Grupos por ciclo
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadGroups()}
                            className="ap-button-secondary"
                        >
                            Recargar
                        </button>
                    </div>

                    {loading ? (
                        <p className="mt-5 text-sm text-[var(--color-text-soft)]">
                            Cargando grupos...
                        </p>
                    ) : Object.keys(groupsByCycle).length === 0 ? (
                        <div className="mt-5 rounded-3xl border border-dashed border-[var(--color-border)] bg-white/60 p-6">
                            <h4 className="text-base font-semibold text-[var(--color-text)]">
                                Aún no hay grupos registrados
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                Crea el primer grupo para poder asignar alumnos, docentes y tutor.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-3">
                            {Object.entries(groupsByCycle).map(([cycleLabel, count]) => (
                                <div
                                    key={cycleLabel}
                                    className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-medium text-[var(--color-text)]">
                                            {cycleLabel}
                                        </p>

                                        <span className="ap-badge ap-badge-brand">
                                            {count} {count === 1 ? "grupo" : "grupos"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="ap-eyebrow">Listado</p>

                        <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                            Grupos registrados
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Revisa rápidamente a qué ciclo pertenece cada grupo.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="text-sm text-[var(--color-text-soft)]">Cargando grupos...</p>
                ) : groups.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white/60 p-6">
                        <h4 className="text-base font-semibold text-[var(--color-text)]">
                            No hay grupos para mostrar
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            Cuando registres grupos, aparecerán aquí organizados para consulta.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {groups.map((group) => (
                            <article
                                key={group.id}
                                className="rounded-3xl border border-[var(--color-border)] bg-white/75 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                                            Grupo
                                        </p>

                                        <h4 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                                            {group.code}
                                        </h4>
                                    </div>

                                    <span className="ap-badge ap-badge-neutral">
                                        {group.cycleCode}
                                    </span>
                                </div>

                                <p className="mt-4 text-sm font-medium text-[var(--color-text)]">
                                    {group.name}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                    {group.cycleName}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}