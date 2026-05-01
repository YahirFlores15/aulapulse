import { listAssignedGroups } from "@/server/domains/tutor/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import Link from "next/link";


export default async function TutorGroupsPage() {
    const session = await requireRolePageAccess(ROLE.TUTOR);
    const groups = listAssignedGroups(session.userId);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Tutor</p>

                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Mis grupos
                </h2>

                <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                    Aquí ves únicamente los grupos que tienes asignados como tutor. Nada de
                    andar curioseando donde no te toca. Un gesto humilde pero civilizado.
                </p>
            </section>

            <section className="ap-panel p-6">
                {groups.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-soft)]">
                        No tienes grupos asignados todavía.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Ciclo
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Grupo
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Tutor
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {groups.map((group) => (
                                    <tr
                                        key={group.id}
                                        className="border-b border-[var(--color-border)]/70"
                                    >
                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {group.cycleCode} · {group.cycleName}
                                        </td>

                                        <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                                            {group.code}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {group.name}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {group.tutorName}
                                        </td>

                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/tutor/groups/${group.id}`}
                                                className="font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                            >
                                                Ver alumnos
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