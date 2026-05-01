import { getReferralCaseDetailForActor } from "@/server/domains/referrals/service";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { ReferralWorkflowError } from "@/server/domains/referrals/errors";
import { requireRolePageAccess } from "@/server/auth/page-access";
import type { CaseStatus } from "@/shared/enums/case-status";
import { ROLE } from "@/shared/enums/roles";
import { notFound } from "next/navigation";
import Link from "next/link";


type PageProps = {
    params: Promise<{
        caseId: string;
    }>;
};

function getStatusBadgeClass(status: CaseStatus) {
    if (status === "CLOSED") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    return "border-amber-200 bg-amber-50 text-amber-800";
}

function getStatusLabel(status: CaseStatus) {
    return status === "CLOSED" ? "Cerrado" : "Abierto";
}

function getTargetAreaLabel(targetArea: ReferralTargetArea) {
    return targetArea === "PEDAGOGY" ? "Pedagogía" : "Psicología";
}

function getTargetAreaClass(targetArea: ReferralTargetArea) {
    if (targetArea === "PEDAGOGY") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    return "border-violet-200 bg-violet-50 text-violet-800";
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

function formatDate(value: string | null) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("es-MX");
}

export default async function DirectorReferralDetailPage({ params }: PageProps) {
    const session = await requireRolePageAccess(ROLE.DIRECTOR, {
        loginPath: "/login?next=/director/referrals",
        forbiddenPath: "/login?next=/director/referrals",
    });

    const resolvedParams = await params;
    const caseId = Number(resolvedParams.caseId);

    if (!Number.isInteger(caseId) || caseId <= 0) {
        notFound();
    }

    try {
        const detail = getReferralCaseDetailForActor(
            session.userId,
            session.roles,
            caseId,
        );

        const { caseItem, notes, events } = detail;
        const isClosed = caseItem.status === "CLOSED";

        return (
            <div className="space-y-8">
                <section className="ap-panel p-8">
                    <Link
                        href="/director/referrals"
                        className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                    >
                        ← Volver a canalizaciones
                    </Link>

                    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="ap-eyebrow">Detalle de canalización</p>

                            <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                                Caso #{caseItem.id}
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                                {caseItem.studentFullName} · {caseItem.studentControlNumber} ·{" "}
                                {caseItem.groupCode}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span
                                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                                    caseItem.status,
                                )}`}
                            >
                                {getStatusLabel(caseItem.status)}
                            </span>

                            <span
                                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getTargetAreaClass(
                                    caseItem.targetArea,
                                )}`}
                            >
                                {getTargetAreaLabel(caseItem.targetArea)}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                    <article className="ap-panel p-6">
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Datos del caso
                        </h2>

                        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Alumno
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.studentFullName}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Número de control
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.studentControlNumber}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Grupo
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.groupCode} · {caseItem.groupName}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Motivo
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.reasonName}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Creado por
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.createdByName}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Docente relacionado
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.relatedTeacherName ?? "No asignado"}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Apertura
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {formatDate(caseItem.openedAt)}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Cierre
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {caseItem.closedAt
                                        ? formatDate(caseItem.closedAt)
                                        : "Abierto"}
                                </dd>
                            </div>

                            <div className="sm:col-span-2">
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Resumen
                                </dt>
                                <dd className="ap-panel-muted mt-2 p-4 text-sm leading-6 text-[var(--color-text)]">
                                    {caseItem.summary}
                                </dd>
                            </div>
                        </dl>
                    </article>

                    <article className="ap-panel p-6">
                        <p className="ap-eyebrow">Acciones</p>

                        <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                            Gestión del caso
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            Dirección puede cambiar el área destino, cerrar o reabrir el caso.
                            Útil cuando una canalización empezó en el área equivocada, porque
                            aparentemente eso también pasa en sistemas con formularios.
                        </p>

                        <div className="mt-6 grid gap-6">
                            <form
                                action={`/api/director/referrals/${caseItem.id}/target`}
                                method="POST"
                                className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white/70 p-5"
                            >
                                <div className="ap-field">
                                    <label htmlFor="targetArea" className="ap-label">
                                        Cambiar área destino
                                    </label>

                                    <select
                                        id="targetArea"
                                        name="targetArea"
                                        defaultValue={caseItem.targetArea}
                                        className="ap-select"
                                    >
                                        <option value="PEDAGOGY">Pedagogía</option>
                                        <option value="PSYCHOLOGY">Psicología</option>
                                    </select>
                                </div>

                                <div className="ap-field">
                                    <label htmlFor="targetNote" className="ap-label">
                                        Nota del cambio de área
                                    </label>

                                    <textarea
                                        id="targetNote"
                                        name="note"
                                        rows={3}
                                        maxLength={1000}
                                        className="ap-textarea"
                                        placeholder="Opcional"
                                    />
                                </div>

                                <button type="submit" className="ap-button-secondary">
                                    Actualizar área destino
                                </button>
                            </form>

                            {isClosed ? (
                                <form
                                    action={`/api/director/referrals/${caseItem.id}/reopen`}
                                    method="POST"
                                    className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white/70 p-5"
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
                                    action={`/api/director/referrals/${caseItem.id}/close`}
                                    method="POST"
                                    className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white/70 p-5"
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
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                    <article className="ap-panel p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="ap-eyebrow">Seguimiento</p>

                                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                                    Notas del caso
                                </h2>
                            </div>

                            {isClosed ? (
                                <span className="ap-badge ap-badge-neutral">Solo lectura</span>
                            ) : null}
                        </div>

                        {notes.length === 0 ? (
                            <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
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
                                                {formatDate(note.createdAt)}
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
                                Este caso está cerrado. Las nuevas notas están bloqueadas hasta
                                que se reabra.
                            </div>
                        ) : (
                            <form
                                action={`/api/director/referrals/${caseItem.id}/notes`}
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
                                        minLength={3}
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

                    <article className="ap-panel p-6">
                        <p className="ap-eyebrow">Historial</p>

                        <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                            Línea de tiempo
                        </h2>

                        {events.length === 0 ? (
                            <div className="ap-panel-muted mt-4 p-4 text-sm text-[var(--color-text-soft)]">
                                No hay eventos registrados todavía.
                            </div>
                        ) : (
                            <div className="mt-5 space-y-3">
                                {[...events]
                                    .sort((a, b) =>
                                        b.createdAt.localeCompare(a.createdAt),
                                    )
                                    .map((event) => (
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
                                                    {formatDate(event.createdAt)}
                                                </p>
                                            </div>

                                            {event.fromValue || event.toValue ? (
                                                <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                                                    {event.fromValue ?? "—"} →{" "}
                                                    {event.toValue ?? "—"}
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
    } catch (error: unknown) {
        if (
            error instanceof ReferralWorkflowError &&
            (error.status === 403 || error.status === 404)
        ) {
            notFound();
        }

        throw error;
    }
}