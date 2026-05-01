import { listDirectorReferralCases } from "@/server/domains/referrals/service";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { requireRolePageAccess } from "@/server/auth/page-access";
import type { CaseStatus } from "@/shared/enums/case-status";
import { ROLE } from "@/shared/enums/roles";
import Link from "next/link";


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

function formatDate(value: string) {
    return new Date(value).toLocaleString("es-MX");
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "neutral" | "open" | "closed" | "pedagogy" | "psychology";
}) {
    const className =
        tone === "open"
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : tone === "closed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : tone === "pedagogy"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : tone === "psychology"
                        ? "border-violet-200 bg-violet-50 text-violet-900"
                        : "border-[var(--color-border)] bg-white/75 text-[var(--color-text)]";

    return (
        <div className={`rounded-3xl border p-5 ${className}`}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
    );
}

export default async function DirectorReferralsPage() {
    await requireRolePageAccess(ROLE.DIRECTOR);

    const referrals = listDirectorReferralCases({});

    const summary = referrals.reduce(
        (acc, item) => {
            acc.total += 1;

            if (item.status === "OPEN") acc.open += 1;
            if (item.status === "CLOSED") acc.closed += 1;
            if (item.targetArea === "PEDAGOGY") acc.pedagogy += 1;
            if (item.targetArea === "PSYCHOLOGY") acc.psychology += 1;

            return acc;
        },
        {
            total: 0,
            open: 0,
            closed: 0,
            pedagogy: 0,
            psychology: 0,
        },
    );

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Canalizaciones</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold text-[var(--color-text)]">
                            Supervisión global de canalizaciones
                        </h1>

                        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                            Dirección puede consultar todas las canalizaciones registradas,
                            agregar seguimiento, cambiar el área destino y controlar cierres o
                            reaperturas. Aquí se ve el flujo completo, porque dirigir sin visibilidad
                            es básicamente adivinar con corbata.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            Regla operativa
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            Una canalización pertenece a un alumno, grupo, motivo, estado y área
                            destino: Pedagogía o Psicología.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard label="Total" value={summary.total} tone="neutral" />
                <SummaryCard label="Abiertas" value={summary.open} tone="open" />
                <SummaryCard label="Cerradas" value={summary.closed} tone="closed" />
                <SummaryCard label="Pedagogía" value={summary.pedagogy} tone="pedagogy" />
                <SummaryCard label="Psicología" value={summary.psychology} tone="psychology" />
            </section>

            <section className="ap-panel p-6">
                <div className="mb-5">
                    <p className="ap-eyebrow">Listado</p>

                    <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                        Casos registrados
                    </h2>

                    <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                        Revisa alumno, motivo, área destino y último movimiento.
                    </p>
                </div>

                {referrals.length === 0 ? (
                    <div className="ap-panel-muted p-6 text-sm">
                        <p className="font-semibold text-[var(--color-text)]">
                            No hay canalizaciones registradas
                        </p>

                        <p className="mt-2 leading-6 text-[var(--color-text-soft)]">
                            Cuando Tutoría o Docencia generen canalizaciones, aparecerán aquí para
                            supervisión de Dirección.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {referrals.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-3xl border border-[var(--color-border)] bg-white/75 p-5"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                                    item.status,
                                                )}`}
                                            >
                                                {getStatusLabel(item.status)}
                                            </span>

                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTargetAreaClass(
                                                    item.targetArea,
                                                )}`}
                                            >
                                                {getTargetAreaLabel(item.targetArea)}
                                            </span>

                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                Último movimiento:{" "}
                                                {formatDate(item.lastStatusChangedAt)}
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                                            {item.studentFullName}
                                        </h3>

                                        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                            {item.studentControlNumber} · {item.groupCode} ·{" "}
                                            {item.groupName}
                                        </p>

                                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Motivo
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {item.reasonName}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Creado por
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {item.createdByName}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-3">
                                                <p className="text-xs text-[var(--color-text-faint)]">
                                                    Apertura
                                                </p>
                                                <p className="mt-1 font-medium text-[var(--color-text)]">
                                                    {formatDate(item.openedAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm leading-6 text-[var(--color-text-soft)]">
                                            {item.summary}
                                        </p>
                                    </div>

                                    <div className="shrink-0">
                                        <Link
                                            href={`/director/referrals/${item.id}`}
                                            className="ap-button-secondary"
                                        >
                                            Ver caso
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