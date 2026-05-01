"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import type { TeacherCourseStudentsResponseDto } from "@/shared/dtos/teacher/courses.dto";
import type { IncidentsListResponseDto } from "@/shared/dtos/teacher/capture.dto";
import type { IncidentNotificationStatusDto } from "@/shared/dtos/incidents/incidents.dto";


type IncidentsPageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

type IncidentTypeOption = {
    code: string;
    label: string;
};

const INCIDENT_OPTIONS: IncidentTypeOption[] = [
    { code: "TAREA", label: "Incumplimiento de tarea" },
    { code: "CONDUCTA", label: "Conducta inapropiada" },
    { code: "RESPETO", label: "Falta de respeto" },
    { code: "AGRESION", label: "Agresión" },
];

function buildNotificationStatusLabel(status: IncidentNotificationStatusDto | null) {
    if (!status) {
        return null;
    }

    const emailStatus = status.emailSent
        ? "correo enviado"
        : status.emailAttempted
            ? "correo fallido"
            : "correo omitido";

    return `Notificaciones internas: ${status.internalNotificationsCreated}. ${emailStatus}.`;
}

export default function TeacherIncidentsPage({ params }: IncidentsPageProps) {
    const { courseId: rawCourseId } = use(params);
    const parsedCourseId = Number(rawCourseId);
    const courseId =
        Number.isInteger(parsedCourseId) && parsedCourseId > 0
            ? parsedCourseId
            : null;

    const [courseData, setCourseData] =
        useState<TeacherCourseStudentsResponseDto | null>(null);
    const [incidents, setIncidents] =
        useState<IncidentsListResponseDto["records"]>([]);

    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [typeCode, setTypeCode] = useState<string>("CONDUCTA");
    const [note, setNote] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notificationStatus, setNotificationStatus] =
        useState<IncidentNotificationStatusDto | null>(null);

    const studentNameById = useMemo(() => {
        return new Map(
            (courseData?.students ?? []).map((student) => [
                student.studentId,
                student.fullName,
            ]),
        );
    }, [courseData]);

    const summary = useMemo(() => {
        return {
            total: incidents.length,
            open: incidents.filter((incident) => incident.status === "OPEN").length,
            closed: incidents.filter((incident) => incident.status === "CLOSED").length,
        };
    }, [incidents]);

    async function loadBaseData() {
        if (!courseId) {
            setError("El curso es inválido.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);
        setNotificationStatus(null);

        try {
            const [studentsResponse, incidentsResponse] = await Promise.all([
                fetch(`/api/teacher/courses/${courseId}/students`, {
                    cache: "no-store",
                }),
                fetch(`/api/teacher/courses/${courseId}/incidents`, {
                    cache: "no-store",
                }),
            ]);

            const studentsJson = await studentsResponse.json();
            const incidentsJson = await incidentsResponse.json();

            if (!studentsResponse.ok) {
                throw new Error(
                    studentsJson.error ??
                    studentsJson.message ??
                    "No se pudo cargar el curso.",
                );
            }

            if (!incidentsResponse.ok) {
                throw new Error(
                    incidentsJson.error ??
                    incidentsJson.message ??
                    "No se pudieron cargar las incidencias.",
                );
            }

            setCourseData(studentsJson.data);
            setIncidents((incidentsJson.data as IncidentsListResponseDto).records);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al cargar la pantalla.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBaseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    async function handleSubmit() {
        if (!courseId) {
            setError("El curso es inválido.");
            return;
        }

        if (!selectedStudentId) {
            setError("Debes seleccionar un alumno.");
            return;
        }

        if (!note.trim()) {
            setError("La nota es obligatoria.");
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);
        setNotificationStatus(null);

        try {
            const response = await fetch(`/api/teacher/courses/${courseId}/incidents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: Number(selectedStudentId),
                    typeCode,
                    note,
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.error ??
                    json.message ??
                    "No se pudo registrar la incidencia.",
                );
            }

            const data = json.data as IncidentsListResponseDto;

            setIncidents(data.records);
            setNote("");
            setSelectedStudentId("");
            setTypeCode("CONDUCTA");
            setNotificationStatus(
                (json.notificationStatus as IncidentNotificationStatusDto | undefined) ??
                null,
            );
            setMessage("Incidencia registrada correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al registrar la incidencia.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="ap-panel p-6">
                <p className="text-sm text-[var(--color-text-soft)]">
                    Cargando incidencias...
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

    if (!courseData || !courseId) {
        return null;
    }

    const notificationLabel = buildNotificationStatusLabel(notificationStatus);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <Link
                    href={`/teacher/courses/${courseId}`}
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver al curso
                </Link>

                <p className="ap-eyebrow mt-6">Incidencias</p>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    {courseData.course.subjectCode} · {courseData.course.subjectName}
                </h1>
                <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                    Grupo: {courseData.course.groupCode} · {courseData.course.groupName}
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
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    Registrar incidencia
                </h2>

                <p className="mt-2 text-sm leading-7 text-[var(--color-text-soft)]">
                    La incidencia quedará ligada a este curso, al alumno y al grupo.
                    También actualizará el semáforo general y enviará notificaciones.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="ap-field">
                        <label className="ap-label">Alumno</label>
                        <select
                            value={selectedStudentId}
                            onChange={(event) => setSelectedStudentId(event.target.value)}
                            className="ap-select"
                        >
                            <option value="">Selecciona un alumno</option>
                            {courseData.students.map((student) => (
                                <option key={student.studentId} value={student.studentId}>
                                    {student.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ap-field">
                        <label className="ap-label">Tipo</label>
                        <select
                            value={typeCode}
                            onChange={(event) => setTypeCode(event.target.value)}
                            className="ap-select"
                        >
                            {INCIDENT_OPTIONS.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ap-field md:col-span-2">
                        <label className="ap-label">Nota</label>
                        <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={4}
                            className="ap-textarea"
                            placeholder="Describe la incidencia..."
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="ap-button-primary"
                    >
                        {saving ? "Guardando..." : "Registrar incidencia"}
                    </button>
                </div>

                {message ? (
                    <div className="ap-message ap-message-success mt-4">{message}</div>
                ) : null}

                {notificationLabel ? (
                    <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
                        {notificationLabel}
                        {notificationStatus?.emailError ? (
                            <p className="mt-2">
                                Error de correo: {notificationStatus.emailError}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {error ? (
                    <div className="ap-message ap-message-error mt-4">{error}</div>
                ) : null}
            </section>

            <section className="ap-panel p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Historial de incidencias
                        </h2>
                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Se muestran las incidencias asociadas a este curso.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ap-button-secondary"
                        onClick={loadBaseData}
                    >
                        Recargar
                    </button>
                </div>

                {incidents.length === 0 ? (
                    <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                        No hay incidencias registradas todavía.
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Estado</th>
                                    <th className="px-4 py-3 font-semibold">Fecha</th>
                                    <th className="px-4 py-3 font-semibold">Alumno</th>
                                    <th className="px-4 py-3 font-semibold">Tipo</th>
                                    <th className="px-4 py-3 font-semibold">Nota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((incident) => (
                                    <tr
                                        key={incident.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-4 py-3">
                                            <IncidentStatusBadge
                                                status={incident.status}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {incident.createdAt}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {studentNameById.get(incident.studentId) ??
                                                `Alumno #${incident.studentId}`}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {incident.typeName}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {incident.note}
                                            {incident.closedAt ? (
                                                <p className="mt-2 text-xs">
                                                    Cerrada: {incident.closedAt}
                                                </p>
                                            ) : null}
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