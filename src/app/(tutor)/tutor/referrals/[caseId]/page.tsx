import { getTutorReferralCaseDetail, TutorServiceError } from "@/server/domains/tutor/service";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
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
        return "bg-emerald-100 text-emerald-800";
    }

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

export default async function TutorReferralDetailPage({ params }: PageProps) {
    const session = await requireRolePageAccess(ROLE.TUTOR, {
        loginPath: "/login?next=/tutor/referrals",
        forbiddenPath: "/login?next=/tutor/referrals",
    });

    const resolvedParams = await params;
    const caseId = Number(resolvedParams.caseId);

    if (!Number.isInteger(caseId) || caseId <= 0) {
        notFound();
    }

    try {
        const detail = getTutorReferralCaseDetail(caseId, session.userId);
        const { case: caseItem, notes, events } = detail;
        const isClosed = caseItem.status === "CLOSED";

        return (
            <div className="space-y-8">
                <section className="ap-panel p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <Link
                                href="/tutor/referrals"
                                className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                            >
                                ← Volver a canalizaciones
                            </Link>

                            <h1 className="mt-5 text-3xl font-semibold text-[var(--color-text)]">
                                Caso #{caseItem.id}
                            </h1>

                            <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                                {caseItem.studentName} · {caseItem.groupCode} · {caseItem.reasonName}
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
                            Datos del caso
                        </h2>

                        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Alumno
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {caseItem.studentName}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Número de control
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {caseItem.studentControlNumber}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Grupo
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {caseItem.groupCode}
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
                                    Creado por
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {caseItem.createdByName}
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
                                    Último cambio de estado
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {new Date(caseItem.lastStatusChangedAt ?? caseItem.updatedAt).toLocaleString("es-MX")}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Cerrado por
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {caseItem.closedByName ?? "No aplica"}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                                    Reabierto por
                                </dt>
                                <dd className="mt-1 text-sm text-[var(--color-text)]">
                                    {caseItem.reopenedByName ?? "No aplica"}
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
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold text-[var(--color-text)]">
                                Notas del caso
                            </h2>
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
                                Este caso está cerrado. Las nuevas notas están bloqueadas.
                            </div>
                        ) : (
                            <form
                                action={`/api/tutor/referrals/${caseItem.id}/notes`}
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
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="ap-panel p-6">
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Acciones del tutor
                        </h2>

                        <div className="mt-5 grid gap-6">
                            <form
                                action={`/api/tutor/referrals/${caseItem.id}`}
                                method="POST"
                                className="space-y-4"
                            >
                                <input type="hidden" name="_method" value="PATCH" />

                                <div className="ap-field">
                                    <label htmlFor="summary" className="ap-label">
                                        Actualizar resumen
                                    </label>
                                    <textarea
                                        id="summary"
                                        name="summary"
                                        defaultValue={caseItem.summary}
                                        rows={6}
                                        minLength={10}
                                        maxLength={1000}
                                        required
                                        className="ap-textarea"
                                    />
                                </div>

                                <button type="submit" className="ap-button-secondary">
                                    Guardar resumen
                                </button>
                            </form>

                            {isClosed ? (
                                <form
                                    action={`/api/tutor/referrals/${caseItem.id}/reopen`}
                                    method="POST"
                                    className="space-y-4"
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
                                    action={`/api/tutor/referrals/${caseItem.id}/close`}
                                    method="POST"
                                    className="space-y-4"
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
    } catch (error) {
        if (
            error instanceof TutorServiceError &&
            (error.status === 403 || error.status === 404)
        ) {
            notFound();
        }

        throw error;
    }
}