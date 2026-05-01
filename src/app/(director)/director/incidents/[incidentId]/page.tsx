"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import type {
    IncidentDetailDto,
    IncidentNotificationStatusDto,
} from "@/shared/dtos/incidents/incidents.dto";

type DirectorIncidentDetailPageProps = {
    params: Promise<{
        incidentId: string;
    }>;
};

function formatOptional(value: string | null) {
    return value ?? "—";
}

function getEventLabel(eventType: string) {
    switch (eventType) {
        case "INCIDENT_CREATED":
            return "Incidencia creada";
        case "NOTE_ADDED":
            return "Nota agregada";
        case "INCIDENT_CLOSED":
            return "Incidencia cerrada";
        case "INCIDENT_REOPENED":
            return "Incidencia reabierta";
        default:
            return eventType;
    }
}

function getSourceRoleLabel(role: string | null) {
    if (role === "DIRECTOR") return "Dirección";
    if (role === "TEACHER") return "Docente";
    if (role === "TUTOR") return "Tutor";

    return "Sin origen";
}

function NotificationStatusPanel({
    notificationStatus,
}: {
    notificationStatus: IncidentNotificationStatusDto;
}) {
    return (
        <div className="ap-panel-muted p-4 text-sm text-[var(--color-text-soft)]">
            <p className="font-semibold text-[var(--color-text)]">
                Resultado de notificación
            </p>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <div>
                    <span className="text-[var(--color-text-faint)]">
                        Internas creadas:
                    </span>{" "}
                    <strong>{notificationStatus.internalNotificationsCreated}</strong>
                </div>

                <div>
                    <span className="text-[var(--color-text-faint)]">Correo:</span>{" "}
                    <strong>
                        {notificationStatus.emailSent
                            ? "enviado"
                            : notificationStatus.emailAttempted
                                ? "fallido"
                                : "omitido"}
                    </strong>
                </div>

                <div>
                    <span className="text-[var(--color-text-faint)]">Error:</span>{" "}
                    <strong>{notificationStatus.emailError ?? "Sin error"}</strong>
                </div>
            </div>
        </div>
    );
}

export default function DirectorIncidentDetailPage({
    params,
}: DirectorIncidentDetailPageProps) {
    const { incidentId } = use(params);

    const [detail, setDetail] = useState<IncidentDetailDto | null>(null);
    const [note, setNote] = useState("");
    const [reason, setReason] = useState("");
    const [notificationStatus, setNotificationStatus] =
        useState<IncidentNotificationStatusDto | null>(null);

    const [loading, setLoading] = useState(true);
    const [savingNote, setSavingNote] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function loadDetail() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/incidents/${incidentId}`, {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo cargar la incidencia.");
            }

            setDetail(json.data as IncidentDetailDto);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al cargar la incidencia.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function addNote() {
        if (!note.trim()) {
            setError("La nota es obligatoria.");
            return;
        }

        setSavingNote(true);
        setError("");
        setMessage("");
        setNotificationStatus(null);

        try {
            const response = await fetch(`/api/incidents/${incidentId}/notes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    note,
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo agregar la nota.");
            }

            setDetail((json.data as { detail: IncidentDetailDto }).detail);
            setNotificationStatus(
                (json.data as { notificationStatus: IncidentNotificationStatusDto })
                    .notificationStatus,
            );
            setNote("");
            setMessage("Nota agregada correctamente.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al agregar nota.");
        } finally {
            setSavingNote(false);
        }
    }

    async function changeStatus(action: "close" | "reopen") {
        setChangingStatus(true);
        setError("");
        setMessage("");
        setNotificationStatus(null);

        try {
            const response = await fetch(`/api/incidents/${incidentId}/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reason,
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json?.error ??
                    (action === "close"
                        ? "No se pudo cerrar la incidencia."
                        : "No se pudo reabrir la incidencia."),
                );
            }

            setDetail((json.data as { detail: IncidentDetailDto }).detail);
            setNotificationStatus(
                (json.data as { notificationStatus: IncidentNotificationStatusDto })
                    .notificationStatus,
            );
            setReason("");
            setMessage(
                action === "close"
                    ? "Incidencia cerrada correctamente."
                    : "Incidencia reabierta correctamente.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al cambiar el estado.",
            );
        } finally {
            setChangingStatus(false);
        }
    }

    useEffect(() => {
        void loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incidentId]);

    const timeline = useMemo(() => {
        if (!detail) {
            return [];
        }

        return [...detail.events].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
        );
    }, [detail]);

    if (loading) {
        return (
            <div className="ap-panel p-6">
                <p className="text-sm text-[var(--color-text-soft)]">
                    Cargando incidencia...
                </p>
            </div>
        );
    }

    if (error && !detail) {
        return (
            <div className="space-y-4">
                <Link
                    href="/director/incidents"
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver a incidencias
                </Link>

                <div className="ap-message ap-message-error">{error}</div>
            </div>
        );
    }

    if (!detail) {
        return null;
    }

    const incident = detail.incident;
    const isOpen = incident.status === "OPEN";

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <Link
                    href="/director/incidents"
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver a incidencias
                </Link>

                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="ap-eyebrow">Detalle de incidencia</p>

                        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                            {incident.typeName}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                            {incident.studentFullName} · {incident.studentControlNumber}
                        </p>
                    </div>

                    <IncidentStatusBadge status={incident.status} />
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                <article className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Información general
                    </h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="ap-panel-muted p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
                                Grupo
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                                {incident.groupCode ?? "Sin grupo"}
                            </p>
                        </div>

                        <div className="ap-panel-muted p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
                                Materia
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                                {incident.subjectName ?? "General"}
                            </p>
                        </div>

                        <div className="ap-panel-muted p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
                                Origen
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                                {getSourceRoleLabel(incident.sourceRole)}
                            </p>
                        </div>

                        <div className="ap-panel-muted p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
                                Fecha de registro
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                                {incident.createdAt}
                            </p>
                        </div>

                        <div className="ap-panel-muted p-4 md:col-span-2">
                            <p className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
                                Registrada por
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                                {incident.createdByName}
                            </p>
                        </div>
                    </div>

                    <div className="ap-panel-muted mt-6 p-4 text-sm leading-7 text-[var(--color-text-soft)]">
                        {incident.note}
                    </div>
                </article>

                <aside className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Estado
                    </h2>

                    <div className="mt-5 space-y-3 text-sm">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">
                                Cerrada por
                            </p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {formatOptional(incident.closedByName)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">
                                Fecha de cierre
                            </p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {formatOptional(incident.closedAt)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">
                                Reabierta por
                            </p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {formatOptional(incident.reopenedByName)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                            <p className="text-xs text-[var(--color-text-faint)]">
                                Fecha de reapertura
                            </p>
                            <p className="mt-1 font-medium text-[var(--color-text)]">
                                {formatOptional(incident.reopenedAt)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="ap-label">
                            Motivo de cierre o reapertura
                        </label>

                        <textarea
                            className="ap-textarea mt-2"
                            rows={3}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Motivo opcional..."
                        />
                    </div>

                    <div className="mt-4">
                        {isOpen ? (
                            <button
                                type="button"
                                className="ap-button-primary"
                                onClick={() => void changeStatus("close")}
                                disabled={changingStatus}
                            >
                                {changingStatus ? "Procesando..." : "Cerrar incidencia"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="ap-button-primary"
                                onClick={() => void changeStatus("reopen")}
                                disabled={changingStatus}
                            >
                                {changingStatus ? "Procesando..." : "Reabrir incidencia"}
                            </button>
                        )}
                    </div>
                </aside>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <article className="ap-panel p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="ap-eyebrow">Seguimiento</p>

                            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                                Notas de la incidencia
                            </h2>
                        </div>

                        {!isOpen ? (
                            <span className="ap-badge ap-badge-neutral">
                                Solo lectura
                            </span>
                        ) : null}
                    </div>

                    {detail.notes.length === 0 ? (
                        <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
                            No hay notas de seguimiento.
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {detail.notes.map((item) => (
                                <div key={item.id} className="ap-panel-muted p-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <p className="text-sm font-semibold text-[var(--color-text)]">
                                            {item.authorName}
                                        </p>

                                        <p className="text-xs text-[var(--color-text-soft)]">
                                            {item.createdAt}
                                        </p>
                                    </div>

                                    <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">
                                        {item.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {isOpen ? (
                        <div className="mt-6">
                            <label className="ap-label">Nueva nota</label>

                            <textarea
                                className="ap-textarea mt-2"
                                rows={4}
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder="Describe el seguimiento..."
                            />

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    className="ap-button-primary"
                                    onClick={() => void addNote()}
                                    disabled={savingNote}
                                >
                                    {savingNote ? "Guardando..." : "Agregar nota"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="ap-panel-muted mt-6 p-4 text-sm text-[var(--color-text-soft)]">
                            La incidencia está cerrada. Reábrela para agregar nuevas notas.
                        </div>
                    )}
                </article>

                <article className="ap-panel p-6">
                    <p className="ap-eyebrow">Historial</p>

                    <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                        Línea de tiempo
                    </h2>

                    {timeline.length === 0 ? (
                        <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
                            No hay eventos registrados.
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {timeline.map((event) => (
                                <div key={event.id} className="ap-panel-muted p-4">
                                    <p className="text-sm font-semibold text-[var(--color-text)]">
                                        {getEventLabel(event.eventType)}
                                    </p>

                                    <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                        {event.actorName} · {event.createdAt}
                                    </p>

                                    {event.fromValue || event.toValue ? (
                                        <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                                            {event.fromValue ?? "—"} → {event.toValue ?? "—"}
                                        </p>
                                    ) : null}

                                    {event.note ? (
                                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                                            {event.note}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>

            {message ? (
                <div className="ap-message ap-message-success">{message}</div>
            ) : null}

            {error ? (
                <div className="ap-message ap-message-error">{error}</div>
            ) : null}

            {notificationStatus ? (
                <NotificationStatusPanel notificationStatus={notificationStatus} />
            ) : null}
        </div>
    );
}