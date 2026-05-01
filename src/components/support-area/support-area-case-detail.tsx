import type { SupportCaseDetailDto } from "@/shared/dtos/support/support.dto";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import type { SupportAreaConfig } from "@/shared/lib/support-area-routing";
import type { CaseStatus } from "@/shared/enums/case-status";
import Link from "next/link";


type Props = {
    area: SupportAreaConfig;
    detail: SupportCaseDetailDto;
};

function getRiskLabel(value: "GREEN" | "YELLOW" | "RED" | null) {
    if (value === "GREEN") return "Verde";
    if (value === "YELLOW") return "Amarillo";
    if (value === "RED") return "Rojo";
    return "Pendiente";
}

function getRiskBadgeClass(value: "GREEN" | "YELLOW" | "RED" | null) {
    if (value === "GREEN") return "bg-emerald-100 text-emerald-800";
    if (value === "YELLOW") return "bg-amber-100 text-amber-800";
    if (value === "RED") return "bg-rose-100 text-rose-800";
    return "bg-slate-100 text-slate-700";
}

function getStatusBadgeClass(status: CaseStatus) {
    if (status === "CLOSED") return "bg-emerald-100 text-emerald-800";
    return "bg-amber-100 text-amber-800";
}

function getTargetAreaLabel(targetArea: ReferralTargetArea) {
    return targetArea === "PEDAGOGY" ? "Pedagogía" : "Psicología";
}

function getEventLabel(eventType: string) {
    switch (eventType) {
        case "CASE_CREATED":
            return "Caso creado";
        case "NOTE_ADDED":
            return "Nota agregada";
        case "CASE_CLOSED":
            return "Caso cerrado";
        case "CASE_REOPENED":
            return "Caso reabierto";
        case "TARGET_CHANGED":
            return "Área destino cambiada";
        default:
            return eventType;
    }
}

export function SupportAreaCaseDetail({ area, detail }: Props) {
    const { caseItem, expedient, notes, events } = detail;
    const isClosed = caseItem.status === "CLOSED";

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <Link
                            href={area.casesPath}
                            className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                        >
                            ← Volver a casos de {area.shortTitle}
                        </Link>

                        <h1 className="mt-5 text-3xl font-semibold text-[var(--color-text)]">
                            Caso #{caseItem.id}
                        </h1>

                        <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                            {caseItem.studentFullName} · {caseItem.groupCode} · {caseItem.reasonName}
                        </p>
                    </div>

                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                            caseItem.status,
                        )}`}
                    >
                        {caseItem.status}
                    </span>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <article className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Resumen del caso
                    </h2>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Alumno
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {caseItem.studentFullName}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Grupo
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {caseItem.groupCode} · {caseItem.groupName}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Motivo
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {caseItem.reasonName}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Área destino
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {getTargetAreaLabel(caseItem.targetArea)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Apertura
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {new Date(caseItem.openedAt).toLocaleString("es-MX")}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Último movimiento
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {new Date(caseItem.lastStatusChangedAt).toLocaleString("es-MX")}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Incidencia origen
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {caseItem.incidentId
                                    ? `#${caseItem.incidentId} · ${caseItem.incidentTypeName ?? "Sin tipo"}`
                                    : "Sin incidencia vinculada"}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Estado de incidencia
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {caseItem.incidentStatus ?? "No aplica"}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                            Resumen
                        </p>
                        <div className="ap-panel-muted mt-2 p-4 text-sm leading-6 text-[var(--color-text)]">
                            {caseItem.summary}
                        </div>
                    </div>
                </article>

                <article className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Expediente básico
                    </h2>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Número de control
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {expedient.controlNumber}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Nombre completo
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {expedient.fullName}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Ciclo
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {expedient.cycleCode} · {expedient.cycleName}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Grupo
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {expedient.groupCode} · {expedient.groupName}
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                Correo
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--color-text)]">
                                {expedient.email ?? "Sin correo registrado"}
                            </dd>
                        </div>
                    </dl>
                </article>
            </section>

            <section className="ap-panel p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    Materias y semáforo
                </h2>

                {expedient.subjects.length === 0 ? (
                    <div className="ap-panel-muted mt-4 p-5 text-sm text-[var(--color-text-soft)]">
                        No hay materias registradas para este grupo.
                    </div>
                ) : (
                    <div className="mt-5 overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Materia
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Docente
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Semáforo
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Completitud
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {expedient.subjects.map((subject) => (
                                    <tr
                                        key={subject.courseId}
                                        className="border-b border-[var(--color-border)]/70"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {subject.subjectName}
                                            </p>
                                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                {subject.subjectCode}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-[var(--color-text-soft)]">
                                            {subject.teacherName}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(
                                                    subject.riskStatus,
                                                )}`}
                                            >
                                                {getRiskLabel(subject.riskStatus)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {subject.isIncomplete ? (
                                                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                                    Incompleto
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                    Completo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <article className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Incidencias del alumno
                    </h2>

                    {expedient.incidents.length === 0 ? (
                        <div className="ap-panel-muted mt-4 p-5 text-sm text-[var(--color-text-soft)]">
                            No hay incidencias registradas para este alumno.
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {expedient.incidents.map((incident) => (
                                <div key={incident.incidentId} className="ap-panel-muted p-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="font-medium text-[var(--color-text)]">
                                                {incident.typeName}
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                                                {incident.typeCode}
                                            </p>
                                        </div>

                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(incident.createdAt).toLocaleString("es-MX")}
                                        </p>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                                        {incident.note}
                                    </p>

                                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                                        Registrada por: {incident.createdByName}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="ap-panel p-6">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Notas del caso
                        </h2>
                        {isClosed ? (
                            <span className="ap-badge ap-badge-neutral">Solo lectura</span>
                        ) : null}
                    </div>

                    {notes.length === 0 ? (
                        <div className="ap-panel-muted mt-4 p-5 text-sm text-[var(--color-text-soft)]">
                            No hay notas registradas todavía.
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {notes.map((note) => (
                                <div key={note.id} className="ap-panel-muted p-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <p className="text-sm font-medium text-[var(--color-text)]">
                                            {note.authorName}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(note.createdAt).toLocaleString("es-MX")}
                                        </p>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                                        {note.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {isClosed ? (
                        <div className="ap-panel-muted mt-6 p-4 text-sm text-[var(--color-text-soft)]">
                            Este caso está cerrado. Las nuevas notas quedan bloqueadas hasta que se reabra.
                        </div>
                    ) : (
                        <form
                            action={`${area.apiBasePath}/cases/${caseItem.id}/notes`}
                            method="POST"
                            className="mt-6 space-y-4"
                        >
                            <div className="ap-field">
                                <label htmlFor="note" className="ap-label">
                                    Agregar nota
                                </label>
                                <textarea
                                    id="note"
                                    name="note"
                                    rows={5}
                                    minLength={5}
                                    maxLength={2000}
                                    required
                                    className="ap-textarea"
                                    placeholder="Escribe el seguimiento realizado..."
                                />
                            </div>

                            <button type="submit" className="ap-button-primary">
                                Guardar nota
                            </button>
                        </form>
                    )}
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <article className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Acciones de {area.shortTitle}
                    </h2>

                    {isClosed ? (
                        <form
                            action={`${area.apiBasePath}/cases/${caseItem.id}/reopen`}
                            method="POST"
                            className="mt-5 space-y-4"
                        >
                            <div className="ap-field">
                                <label htmlFor="reopenNote" className="ap-label">
                                    Justificación de reapertura
                                </label>
                                <textarea
                                    id="reopenNote"
                                    name="note"
                                    rows={4}
                                    minLength={5}
                                    maxLength={1000}
                                    required
                                    className="ap-textarea"
                                    placeholder="Explica por qué se reabre el caso..."
                                />
                            </div>

                            <button type="submit" className="ap-button-primary">
                                Reabrir caso
                            </button>
                        </form>
                    ) : (
                        <form
                            action={`${area.apiBasePath}/cases/${caseItem.id}/close`}
                            method="POST"
                            className="mt-5 space-y-4"
                        >
                            <div className="ap-field">
                                <label htmlFor="closeNote" className="ap-label">
                                    Nota de cierre
                                </label>
                                <textarea
                                    id="closeNote"
                                    name="note"
                                    rows={4}
                                    maxLength={1000}
                                    className="ap-textarea"
                                    placeholder="Opcional"
                                />
                            </div>

                            <button type="submit" className="ap-button-primary">
                                Cerrar caso
                            </button>
                        </form>
                    )}
                </article>

                <article className="ap-panel p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">
                        Historial del caso
                    </h2>

                    {events.length === 0 ? (
                        <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
                            No hay eventos registrados todavía.
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {events.map((event) => (
                                <div key={event.id} className="ap-panel-muted p-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text)]">
                                                {getEventLabel(event.eventType)}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                {event.actorName}
                                            </p>
                                        </div>

                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(event.createdAt).toLocaleString("es-MX")}
                                        </p>
                                    </div>

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
        </div>
    );
}