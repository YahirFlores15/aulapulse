"use client";

import { useEffect, useMemo, useState } from "react";

type AcademicCycleStatus = "UPCOMING" | "ACTIVE" | "CLOSED";

type Cycle = {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
    ordinal: 1 | 2 | 3;
    status: AcademicCycleStatus;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type CycleRuleItem = {
    code: string;
    label: string;
    range: string;
};

const cycleRules: CycleRuleItem[] = [
    {
        code: "YYYY-1",
        label: "Primer cuatrimestre",
        range: "Enero - Abril",
    },
    {
        code: "YYYY-2",
        label: "Segundo cuatrimestre",
        range: "Mayo - Agosto",
    },
    {
        code: "YYYY-3",
        label: "Tercer cuatrimestre",
        range: "Septiembre - Diciembre",
    },
];

function getStatusLabel(status: AcademicCycleStatus) {
    if (status === "ACTIVE") return "Activo";
    if (status === "UPCOMING") return "Próximo";
    return "Cerrado";
}

function getStatusClassName(status: AcademicCycleStatus) {
    if (status === "ACTIVE") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "UPCOMING") {
        return "border-sky-200 bg-sky-50 text-sky-800";
    }

    return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getStatusDescription(status: AcademicCycleStatus) {
    if (status === "ACTIVE") {
        return "Ciclo operativo actual.";
    }

    if (status === "UPCOMING") {
        return "Disponible para planeación.";
    }

    return "Ciclo histórico cerrado.";
}

function formatDate(value: string) {
    const [year, month, day] = value.split("-");

    return `${day}/${month}/${year}`;
}

function sortCyclesByOrdinal(cycles: Cycle[]) {
    return cycles.slice().sort((a, b) => a.ordinal - b.ordinal);
}

export default function DirectorCyclesPage() {
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadCycles() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/director/cycles", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar los ciclos");
            }

            setCycles(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar ciclos");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadCycles();
    }, []);

    const currentCycle = useMemo(
        () => cycles.find((cycle) => cycle.status === "ACTIVE") ?? null,
        [cycles],
    );

    const upcomingCyclesCount = useMemo(
        () => cycles.filter((cycle) => cycle.status === "UPCOMING").length,
        [cycles],
    );

    const closedCyclesCount = useMemo(
        () => cycles.filter((cycle) => cycle.status === "CLOSED").length,
        [cycles],
    );

    const groupedCycles = useMemo(() => {
        return cycles.reduce<Record<string, Cycle[]>>((acc, cycle) => {
            const year = String(cycle.year);

            if (!acc[year]) {
                acc[year] = [];
            }

            acc[year].push(cycle);
            return acc;
        }, {});
    }, [cycles]);

    const years = Object.keys(groupedCycles).sort((a, b) => Number(b) - Number(a));

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="ap-eyebrow">Ciclos</p>

                        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                            Ciclos escolares automáticos
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            AulaPulse genera los ciclos por cuatrimestre y detecta el ciclo
                            actual según la fecha. Dirección ya no crea ni edita ciclos
                            manualmente; solo consulta la estructura académica disponible.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadCycles()}
                        className="ap-button-secondary w-fit"
                    >
                        Recargar ciclos
                    </button>
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-3">
                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                            Ciclo actual
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                            {currentCycle?.code ?? "Sin activo"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            {currentCycle?.name ?? "No detectado para la fecha actual"}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                            Próximos
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                            {upcomingCyclesCount}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            Ciclos disponibles para planeación
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                            Históricos
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                            {closedCyclesCount}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            Ciclos ya cerrados por fecha
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="ap-panel p-6">
                    <div className="flex flex-col gap-2">
                        <p className="ap-eyebrow">Ciclo actual</p>

                        <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            Estado operativo
                        </h3>
                    </div>

                    {loading ? (
                        <div className="mt-5 rounded-3xl border border-[var(--color-border)] bg-white/70 p-5 text-sm text-[var(--color-text-soft)]">
                            Detectando ciclo actual...
                        </div>
                    ) : currentCycle ? (
                        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6">
                            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <span className="inline-flex rounded-full border border-emerald-300 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-800">
                                        Activo ahora
                                    </span>

                                    <h4 className="mt-4 text-3xl font-semibold text-emerald-950">
                                        {currentCycle.code}
                                    </h4>

                                    <p className="mt-2 text-lg font-medium text-emerald-900">
                                        {currentCycle.name}
                                    </p>

                                    <p className="mt-4 text-sm text-emerald-800">
                                        {formatDate(currentCycle.startDate)} al{" "}
                                        {formatDate(currentCycle.endDate)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900">
                                    Este ciclo se usa para organizar grupos, cursos y
                                    asignaciones actuales.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                            No hay ciclo activo para la fecha actual. Revisa que las
                            migraciones de ciclos automáticos estén aplicadas y que existan
                            ciclos generados para este año.
                        </div>
                    )}
                </div>

                <div className="ap-panel p-6">
                    <p className="ap-eyebrow">Regla institucional</p>

                    <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">
                        Tres ciclos por año
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        La estructura se calcula automáticamente. Nada de capturar fechas a
                        mano y luego preguntarse por qué el sistema vive confundido, clásico.
                    </p>

                    <div className="mt-5 space-y-3">
                        {cycleRules.map((rule) => (
                            <div
                                key={rule.code}
                                className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--color-text)]">
                                            {rule.label}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                            {rule.range}
                                        </p>
                                    </div>

                                    <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)]">
                                        {rule.code}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="ap-eyebrow">Historial y planeación</p>

                        <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                            Ciclos generados
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Se muestran ciclos del año anterior, actual y siguiente para
                            consultar historial y preparar estructura académica.
                        </p>
                    </div>
                </div>

                {error ? <div className="ap-message ap-message-error">{error}</div> : null}

                {loading ? (
                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5 text-sm text-[var(--color-text-soft)]">
                        Cargando ciclos...
                    </div>
                ) : cycles.length === 0 ? (
                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5 text-sm text-[var(--color-text-soft)]">
                        Aún no hay ciclos generados.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {years.map((year) => (
                            <div
                                key={year}
                                className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-[var(--color-text)]">
                                            Año {year}
                                        </h4>

                                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                            {groupedCycles[year].length} ciclos generados
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 xl:grid-cols-3">
                                    {sortCyclesByOrdinal(groupedCycles[year]).map((cycle) => (
                                        <article
                                            key={cycle.id}
                                            className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-semibold text-[var(--color-text)]">
                                                        {cycle.code}
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                                        {cycle.name}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(
                                                        cycle.status,
                                                    )}`}
                                                >
                                                    {getStatusLabel(cycle.status)}
                                                </span>
                                            </div>

                                            <div className="mt-4 space-y-2 text-sm text-[var(--color-text-soft)]">
                                                <p>
                                                    <span className="font-medium text-[var(--color-text)]">
                                                        Inicio:
                                                    </span>{" "}
                                                    {formatDate(cycle.startDate)}
                                                </p>

                                                <p>
                                                    <span className="font-medium text-[var(--color-text)]">
                                                        Fin:
                                                    </span>{" "}
                                                    {formatDate(cycle.endDate)}
                                                </p>

                                                <p className="pt-2 text-xs text-[var(--color-text-muted)]">
                                                    {getStatusDescription(cycle.status)}
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}