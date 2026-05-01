import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { listTutorReferralCases } from "@/server/domains/tutor/service";
import type { CaseStatus } from "@/shared/enums/case-status";
import { getValidatedSession } from "@/server/auth/session";
import { ROLE } from "@/shared/enums/roles";
import { redirect } from "next/navigation";
import Link from "next/link";


function getStatusBadgeClass(status: CaseStatus) {
    if (status === "CLOSED") {
        return "bg-emerald-100 text-emerald-800";
    }

    return "bg-amber-100 text-amber-800";
}

function getTargetAreaLabel(targetArea: ReferralTargetArea) {
    return targetArea === "PEDAGOGY" ? "Pedagogía" : "Psicología";
}

export default async function TutorReferralsPage() {
    const session = await getValidatedSession();

    if (!session) {
        redirect("/login");
    }

    if (!session.roles.includes(ROLE.TUTOR)) {
        redirect("/login");
    }

    const referrals = listTutorReferralCases(session.userId);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="ap-eyebrow">Tutor</p>
                        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                            Canalizaciones
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Consulta los casos de tus grupos con estado real, área destino y
                            trazabilidad. El software, por fin, se comporta como si alguien lo
                            hubiera pensado más de cinco minutos.
                        </p>
                    </div>

                    <Link
                        href="/tutor/referrals/new"
                        className="ap-button-primary"
                    >
                        Nueva canalización
                    </Link>
                </div>
            </section>

            <section className="ap-panel p-6">
                {referrals.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-soft)]">
                        No hay canalizaciones registradas todavía.
                    </p>
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
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {referrals.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-[var(--color-border)]/70"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {item.studentName}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {item.studentControlNumber}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {item.groupCode}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {item.reasonName}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {getTargetAreaLabel(item.targetArea)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                                    item.status,
                                                )}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {new Date(item.lastStatusChangedAt ?? item.updatedAt).toLocaleString("es-MX")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/tutor/referrals/${item.id}`}
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