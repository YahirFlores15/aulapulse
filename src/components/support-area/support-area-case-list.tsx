import type { SupportCaseListItemDto } from "@/shared/dtos/support/support.dto";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import type { SupportAreaConfig } from "@/shared/lib/support-area-routing";
import type { CaseStatus } from "@/shared/enums/case-status";
import Link from "next/link";


type Props = {
    area: SupportAreaConfig;
    cases: SupportCaseListItemDto[];
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

export function SupportAreaCaseList({ area, cases }: Props) {
    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Área de apoyo</p>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Casos de {area.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                    Esta bandeja muestra solo canalizaciones enviadas a {area.title}.
                    Si aparece algo de otra área aquí, entonces ya no es bug: es una confesión.
                </p>
            </section>

            <section className="ap-panel p-6">
                {cases.length === 0 ? (
                    <div className="ap-panel-muted p-6 text-sm text-[var(--color-text-soft)]">
                        No hay casos asignados a {area.title} en este momento.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Alumno
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Grupo
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Motivo
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Área destino
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Último movimiento
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((caseItem) => (
                                    <tr
                                        key={caseItem.id}
                                        className="border-b border-[var(--color-border)]/70"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {caseItem.studentFullName}
                                            </p>
                                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                {caseItem.studentControlNumber}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text-soft)]">
                                            {caseItem.groupCode} · {caseItem.groupName}
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text)]">
                                            {caseItem.reasonName}
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text-soft)]">
                                            {getTargetAreaLabel(caseItem.targetArea)}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                                    caseItem.status,
                                                )}`}
                                            >
                                                {caseItem.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text-soft)]">
                                            {new Date(caseItem.lastStatusChangedAt).toLocaleString(
                                                "es-MX",
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <Link
                                                href={`${area.casesPath}/${caseItem.id}`}
                                                className="font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                            >
                                                Ver caso
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