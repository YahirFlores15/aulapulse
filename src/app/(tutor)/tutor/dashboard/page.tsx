import { listAssignedGroups, listTutorReferralCases } from "@/server/domains/tutor/service";
import type { ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import Link from "next/link";


function getTargetAreaLabel(targetArea: ReferralTargetArea) {
    return targetArea === "PEDAGOGY" ? "Pedagogía" : "Psicología";
}

export default async function TutorDashboardPage() {
    const session = await requireRolePageAccess(ROLE.TUTOR);

    const groups = listAssignedGroups(session.userId);
    const referrals = listTutorReferralCases(session.userId);
    const recentCases = referrals.slice(0, 5);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Panel principal</p>

                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Dashboard de tutor
                </h2>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                    Aquí puedes revisar tus grupos asignados, ver alumnos por grupo y dar
                    seguimiento a canalizaciones abiertas. Operación real, estructura clara
                    y menos improvisación visual. La civilización avanza.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="ap-panel p-6">
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Grupos asignados
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {groups.length}
                    </p>
                </div>

                <div className="ap-panel p-6">
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Canalizaciones totales
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {referrals.length}
                    </p>
                </div>

                <div className="ap-panel p-6">
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Casos abiertos
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {referrals.filter((item) => item.status === "OPEN").length}
                    </p>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="ap-panel p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            Mis grupos
                        </h3>

                        <Link href="/tutor/groups" className="ap-button-secondary">
                            Ver todos
                        </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        {groups.length === 0 ? (
                            <p className="text-sm text-[var(--color-text-soft)]">
                                No tienes grupos asignados todavía.
                            </p>
                        ) : (
                            groups.slice(0, 5).map((group) => (
                                <div key={group.id} className="ap-panel-muted p-4">
                                    <p className="text-sm font-semibold text-[var(--color-text)]">
                                        {group.code} · {group.name}
                                    </p>

                                    <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                        {group.cycleCode} · {group.cycleName}
                                    </p>

                                    <Link
                                        href={`/tutor/groups/${group.id}`}
                                        className="mt-3 inline-block text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                    >
                                        Ver grupo
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="ap-panel p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            Canalizaciones recientes
                        </h3>

                        <Link href="/tutor/referrals" className="ap-button-secondary">
                            Ver todas
                        </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        {recentCases.length === 0 ? (
                            <p className="text-sm text-[var(--color-text-soft)]">
                                No hay canalizaciones registradas todavía.
                            </p>
                        ) : (
                            recentCases.map((item) => (
                                <div key={item.id} className="ap-panel-muted p-4">
                                    <p className="text-sm font-semibold text-[var(--color-text)]">
                                        {item.studentName}
                                    </p>

                                    <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                        {item.groupCode} · {item.reasonName}
                                    </p>

                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                        Estado: {item.status} · Área destino:{" "}
                                        {getTargetAreaLabel(item.targetArea)}
                                    </p>

                                    <Link
                                        href={`/tutor/referrals/${item.id}`}
                                        className="mt-3 inline-block text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                    >
                                        Ver caso
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}