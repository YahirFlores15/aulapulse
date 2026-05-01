import { TrafficLightCausesList } from "@/components/risk/traffic-light-causes-list";
import { TrafficLightBadge } from "@/components/risk/traffic-light-badge";
import { getGroupStudentsWithRisk } from "@/server/domains/tutor/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import { notFound } from "next/navigation";
import Link from "next/link";


function riskLabel(risk: "GREEN" | "YELLOW" | "RED" | null) {
    if (risk === "GREEN") return "Verde";
    if (risk === "YELLOW") return "Amarillo";
    if (risk === "RED") return "Rojo";
    return "Pendiente";
}

function riskBadgeClass(risk: "GREEN" | "YELLOW" | "RED" | null) {
    if (risk === "GREEN") return "bg-emerald-100 text-emerald-800";
    if (risk === "YELLOW") return "bg-amber-100 text-amber-800";
    if (risk === "RED") return "bg-rose-100 text-rose-800";
    return "bg-slate-100 text-slate-700";
}

function formatCalculatedAt(value: string | null): string {
    if (!value) {
        return "Sin cálculo registrado";
    }

    return value;
}

export default async function TutorGroupDetailPage({
    params,
}: {
    params: Promise<{ groupId: string }>;
}) {
    const session = await requireRolePageAccess(ROLE.TUTOR);

    const { groupId } = await params;
    const parsedGroupId = Number(groupId);

    if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
        notFound();
    }

    const data = getGroupStudentsWithRisk(parsedGroupId, session.userId);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <Link
                    href="/tutor/groups"
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver a grupos
                </Link>

                <p className="ap-eyebrow mt-6">Grupo</p>

                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    {data.group.code} · {data.group.name}
                </h2>

                <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                    {data.group.cycleCode} · {data.group.cycleName}
                </p>
            </section>

            <section className="ap-panel p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            Alumnos del grupo
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            El semáforo general consolida asistencia, calificaciones e incidencias.
                            El detalle por materia se mantiene abajo para ver de dónde viene el
                            problema.
                        </p>
                    </div>

                    <Link
                        href={`/tutor/referrals/new?groupId=${data.group.id}`}
                        className="ap-button-primary"
                    >
                        Nueva canalización
                    </Link>
                </div>

                <div className="mt-6 space-y-4">
                    {data.students.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-soft)]">
                            No hay alumnos asignados a este grupo.
                        </p>
                    ) : (
                        data.students.map((student) => (
                            <div key={student.studentId} className="ap-panel-muted p-5">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-[var(--color-text)]">
                                            {student.fullName}
                                        </p>

                                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                            Control: {student.controlNumber}
                                        </p>

                                        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                            Último cálculo:{" "}
                                            {formatCalculatedAt(student.trafficLightCalculatedAt)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-start gap-3 md:items-end">
                                        <TrafficLightBadge color={student.trafficLight} />

                                        <Link
                                            href={`/tutor/referrals/new?groupId=${data.group.id}&studentId=${student.studentId}`}
                                            className="font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                        >
                                            Canalizar alumno
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                        <p className="text-sm font-semibold text-[var(--color-text)]">
                                            Causas principales
                                        </p>

                                        <div className="mt-3">
                                            <TrafficLightCausesList
                                                causes={student.trafficLightCauses}
                                                maxItems={3}
                                                emptyText="Sin causas de riesgo registradas."
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                        <table className="min-w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-[var(--color-border)] text-left">
                                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                                        Materia
                                                    </th>
                                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                                        Docente
                                                    </th>
                                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                                        Semáforo materia
                                                    </th>
                                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                                        Completitud
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {student.subjects.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="px-3 py-3 text-sm text-[var(--color-text-soft)]"
                                                        >
                                                            No hay materias/cursos configurados para
                                                            este grupo.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    student.subjects.map((subject) => (
                                                        <tr
                                                            key={`${student.studentId}-${subject.subjectCode}-${subject.courseId ?? "na"}`}
                                                            className="border-b border-[var(--color-border)]/70"
                                                        >
                                                            <td className="px-3 py-3 text-[var(--color-text)]">
                                                                {subject.subjectCode} ·{" "}
                                                                {subject.subjectName}
                                                            </td>

                                                            <td className="px-3 py-3 text-[var(--color-text-soft)]">
                                                                {subject.teacherName ?? "Sin docente"}
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <span
                                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeClass(
                                                                        subject.riskStatus,
                                                                    )}`}
                                                                >
                                                                    {riskLabel(subject.riskStatus)}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-3">
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
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}