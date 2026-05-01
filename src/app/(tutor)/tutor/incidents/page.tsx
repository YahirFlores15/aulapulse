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

function buildIncidentsUrl(status: IncidentFilterStatus) {
    const params = new URLSearchParams();

    if (status !== "ALL") {
        params.set("status", status);
    }

    const query = params.toString();

    return query ? `/api/incidents?${query}` : "/api/incidents";
}

export default function TutorIncidentsPage() {
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
        loadIncidents(status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const summary = useMemo(() => {
        return {
            total: items.length,
            open: items.filter((item) => item.status === "OPEN").length,
            closed: items.filter((item) => item.status === "CLOSED").length,
        };
    }, [items]);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Incidencias</p>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Incidencias de mis grupos
                </h1>
                <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                    Aquí el tutor consulta incidencias de los alumnos que pertenecen a sus
                    grupos asignados.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Total</p>
                    <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">
                        {summary.total}
                    </p>
                </div>

                <div className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Abiertas</p>
                    <p className="mt-2 text-3xl font-semibold text-rose-700">
                        {summary.open}
                    </p>
                </div>

                <div className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Cerradas</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-700">
                        {summary.closed}
                    </p>
                </div>
            </section>

            <section className="ap-panel p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Incidencias visibles
                        </h2>
                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Solo aparecen incidencias relacionadas con tus grupos.
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
                            onClick={() => loadIncidents(status)}
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
                    <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                        No hay incidencias que coincidan con el filtro.
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Estado</th>
                                    <th className="px-4 py-3 font-semibold">Alumno</th>
                                    <th className="px-4 py-3 font-semibold">Tipo</th>
                                    <th className="px-4 py-3 font-semibold">Grupo</th>
                                    <th className="px-4 py-3 font-semibold">Materia</th>
                                    <th className="px-4 py-3 font-semibold">Fecha</th>
                                    <th className="px-4 py-3 font-semibold">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((incident) => (
                                    <tr
                                        key={incident.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-4 py-3">
                                            <IncidentStatusBadge status={incident.status} />
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {incident.studentFullName}
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                {incident.studentControlNumber}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {incident.typeName}
                                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-soft)]">
                                                {incident.note}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {incident.groupCode ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {incident.subjectName ?? "General"}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {incident.createdAt}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/tutor/incidents/${incident.id}`}
                                                className="font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                            >
                                                Ver detalle
                                            </Link>
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