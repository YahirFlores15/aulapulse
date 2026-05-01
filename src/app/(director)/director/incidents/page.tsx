"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import type {
    IncidentListItemDto,
    IncidentListResponseDto,
    IncidentStatusDto,
} from "@/shared/dtos/incidents/incidents.dto";

type IncidentFilterStatus = "ALL" | IncidentStatusDto;

const statusLabels: Record<IncidentFilterStatus, string> = {
    ALL: "Todas",
    OPEN: "Abiertas",
    CLOSED: "Cerradas",
};

function formatDate(value: string | null) {
    if (!value) {
        return "—";
    }

    return value;
}

function getSourceRoleLabel(role: string | null) {
    if (role === "DIRECTOR") return "Dirección";
    if (role === "TEACHER") return "Docente";
    if (role === "TUTOR") return "Tutor";

    return "Sin origen";
}

function buildIncidentsUrl(status: IncidentFilterStatus) {
    const params = new URLSearchParams();

    if (status !== "ALL") {
        params.set("status", status);
    }

    const query = params.toString();

    return query ? `/api/incidents?${query}` : "/api/incidents";
}

function EmptyState() {
    return (
        <div className="ap-panel-muted mt-6 p-6 text-sm">
            <p className="font-semibold text-[var(--color-text)]">
                No hay incidencias para mostrar
            </p>
            <p className="mt-2 leading-6 text-[var(--color-text-soft)]">
                No existen incidencias que coincidan con el filtro actual. Eso puede ser
                buena señal, o solo que nadie ha registrado nada. El misterio académico,
                como siempre.
            </p>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "neutral" | "open" | "closed";
}) {
    const className =
        tone === "open"
            ? "border-rose-200 bg-rose-50 text-rose-900"
            : tone === "closed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-[var(--color-border)] bg-white/75 text-[var(--color-text)]";

    return (
        <div className={`rounded-3xl border p-5 ${className}`}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
    );
}

export default function DirectorIncidentsPage() {
    const [items, setItems] = useState<IncidentListItemDto[]>([]);
    const [status, setStatus] = useState<IncidentFilterStatus>("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadIncidents(nextStatus = status) {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(buildIncidentsUrl(nextStatus), {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar las incidencias.");
            }

            const data = json.data as IncidentListResponseDto;
            setItems(data.items);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al cargar incidencias.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadIncidents(status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const summary = useMemo(() => {
        const open = items.filter((item) => item.status === "OPEN").length;
        const closed = items.filter((item) => item.status === "CLOSED").length;

        return {
            total: items.length,
            open,
            closed,
        };
    }, [items]);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Incidencias</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold text-[var(--color-text)]">
                            Bandeja global de incidencias
                        </h1>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Dirección puede consultar todas las incidencias registradas,
                            revisar seguimiento y cambiar su estado cuando corresponda.
                            Esta vista concentra alertas académicas antes de que se vuelvan
                            incendios administrativos con logotipo institucional.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            Filtro activo
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-[var(--color-brand-700)]">
                            {statusLabels[status]}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            La consulta se hace contra la API central de incidencias.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Total visibles" value={summary.total} tone="neutral" />
                <SummaryCard label="Abiertas" value={summary.open} tone="open" />
                <SummaryCard label="Cerradas" value={summary.closed} tone="closed" />
            </section>

            <section className="ap-panel p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="ap-eyebrow">Listado</p>

                        <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                            Incidencias registradas
                        </h2>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Revisa alumno, tipo, origen y estado. El detalle conserva notas,
                            historial y acciones de cierre o reapertura.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row">
                        <select
                            className="ap-select"
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value as IncidentFilterStatus)
                            }
                        >
                            <option value="ALL">Todas</option>
                            <option value="OPEN">Abiertas</option>
                            <option value="CLOSED">Cerradas</option>
                        </select>

                        <button
                            type="button"
                            className="ap-button-secondary"
                            onClick={() => void loadIncidents(status)}
                            disabled={loading}
                        >
                            Recargar
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="ap-message ap-message-error mt-4">{error}</div>
                ) : null}

                {loading ? (
                    <p className="mt-6 text-sm text-[var(--color-text-soft)]">
                        Cargando incidencias...
                    </p>
                ) : items.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="mt-6 grid gap-4">
                        {items.map((incident) => (
                            <article
                                key={incident.id}
                                className="rounded-3xl border border-[var(--color-border)] bg-white/75 p-5"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <IncidentStatusBadge status={incident.status} />

                                            <span className="ap-badge ap-badge-neutral">
                                                {getSourceRoleLabel(incident.sourceRole)}
                                            </span>

                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                {formatDate(incident.createdAt)}
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                                            {incident.typeName}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                            {incident.note}
                                        </p>

                                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Alumno
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {incident.studentFullName}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                    {incident.studentControlNumber}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Grupo
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {incident.groupCode ?? "Sin grupo"}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Materia
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {incident.subjectName ?? "General"}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Registrada por
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {incident.createdByName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <Link
                                            href={`/director/incidents/${incident.id}`}
                                            className="ap-button-secondary"
                                        >
                                            Ver detalle
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}