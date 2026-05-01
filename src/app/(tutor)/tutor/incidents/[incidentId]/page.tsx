"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import type {
    IncidentDetailDto,
    IncidentNotificationStatusDto,
} from "@/shared/dtos/incidents/incidents.dto";


type TutorIncidentDetailPageProps = {
    params: Promise<{
        incidentId: string;
    }>;
};

function formatOptional(value: string | null) {
    return value ?? "—";
}

export default function TutorIncidentDetailPage({
    params,
}: TutorIncidentDetailPageProps) {
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
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incidentId]);

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
                    href="/tutor/incidents"
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

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <Link
                    href="/tutor/incidents"
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
                        <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                            Alumno: {incident.studentFullName} · {incident.studentControlNumber}
                        </p>
                    </div>

                    <IncidentStatusBadge status={incident.status} />
                </div>
            </section>

            <section className="ap-panel p-6">
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
                            Registrada por
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                            {incident.createdByName}
                        </p>
                    </div>

                    <div className="ap-panel-muted p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">
                            Fecha
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                            {incident.createdAt}
                        </p>
                    </div>
                </div>

                <div className="ap-panel-muted mt-6 p-4 text-sm leading-7 text-[var(--color-text-soft)]">
                    {incident.note}
                </div>
            </section>

            <section className="ap-panel p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    Seguimiento
                </h2>

                {detail.notes.length === 0 ? (
                    <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
                        No hay notas de seguimiento.
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {detail.notes.map((item) => (
                            <div key={item.id} className="ap-panel-muted p-4">
                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                    {item.authorName}
                                </p>
                                <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                    {item.createdAt}
                                </p>
                                <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">
                                    {item.note}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {incident.status === "OPEN" ? (
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
                                onClick={addNote}
                                disabled={savingNote}
                            >
                                {savingNote ? "Guardando..." : "Agregar nota"}
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>

            <section className="ap-panel p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    Estado de la incidencia
                </h2>

                <div className="mt-4 grid gap-3 text-sm text-[var(--color-text-soft)]">
                    <p>Cerrada por: {formatOptional(incident.closedByName)}</p>
                    <p>Fecha de cierre: {formatOptional(incident.closedAt)}</p>
                    <p>Reabierta por: {formatOptional(incident.reopenedByName)}</p>
                    <p>Fecha de reapertura: {formatOptional(incident.reopenedAt)}</p>
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

                <div className="mt-4 flex flex-wrap gap-3">
                    {incident.status === "OPEN" ? (
                        <button
                            type="button"
                            className="ap-button-primary"
                            onClick={() => changeStatus("close")}
                            disabled={changingStatus}
                        >
                            {changingStatus ? "Procesando..." : "Cerrar incidencia"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="ap-button-primary"
                            onClick={() => changeStatus("reopen")}
                            disabled={changingStatus}
                        >
                            {changingStatus ? "Procesando..." : "Reabrir incidencia"}
                        </button>
                    )}
                </div>
            </section>

            <section className="ap-panel p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    Historial
                </h2>

                <div className="mt-4 space-y-3">
                    {detail.events.map((event) => (
                        <div key={event.id} className="ap-panel-muted p-4">
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                                {event.eventType}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                {event.actorName} · {event.createdAt}
                            </p>
                            {event.note ? (
                                <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                                    {event.note}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </div>
            </section>

            {message ? (
                <div className="ap-message ap-message-success">{message}</div>
            ) : null}

            {error ? (
                <div className="ap-message ap-message-error">{error}</div>
            ) : null}

            {notificationStatus ? (
                <div className="ap-panel-muted p-4 text-sm text-[var(--color-text-soft)]">
                    Notificaciones internas creadas:{" "}
                    <strong>{notificationStatus.internalNotificationsCreated}</strong>
                    <br />
                    Correo:{" "}
                    <strong>
                        {notificationStatus.emailSent
                            ? "enviado"
                            : notificationStatus.emailAttempted
                                ? "fallido"
                                : "omitido"}
                    </strong>
                    {notificationStatus.emailError ? (
                        <>
                            <br />
                            Error correo: {notificationStatus.emailError}
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}