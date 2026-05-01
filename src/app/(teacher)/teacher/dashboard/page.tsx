import { TeacherService } from "@/server/domains/teacher/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import Link from "next/link";


type QuickAction = {
    href: string;
    title: string;
    description: string;
};

const quickActions: QuickAction[] = [
    {
        href: "/teacher/courses",
        title: "Mis cursos",
        description: "Consulta tus cursos asignados y entra a captura académica.",
    },
];

export default async function TeacherDashboardPage() {
    const session = await requireRolePageAccess(ROLE.TEACHER);

    const service = new TeacherService();
    const courses = service.listCourses(session.userId);

    const latestCourses = courses.slice(0, 5);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Módulo docente</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold text-[var(--color-text)]">
                            Panel principal
                        </h1>

                        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                            Desde aquí revisas tus cursos asignados y entras a captura de
                            asistencia, calificaciones e incidencias. El sistema solo muestra los
                            cursos donde eres docente titular, porque dar acceso a todo por
                            comodidad sería una excelente forma de romper permisos con estilo.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            Flujo docente recomendado
                        </p>

                        <ol className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
                            <li>1. Revisa tus cursos asignados.</li>
                            <li>2. Configura unidades de evaluación.</li>
                            <li>3. Captura asistencia diaria.</li>
                            <li>4. Registra incidencias cuando aplique.</li>
                        </ol>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/teacher/courses" className="ap-button-primary">
                        Ver mis cursos
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <article className="ap-panel p-6">
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Cursos asignados
                    </p>

                    <p className="mt-3 text-4xl font-semibold text-[var(--color-text)]">
                        {courses.length}
                    </p>
                </article>

                <article className="ap-panel p-6 md:col-span-2">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                        Accesos rápidos
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-4 transition hover:border-[var(--color-brand-300)]"
                            >
                                <p className="font-semibold text-[var(--color-text)]">
                                    {action.title}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                    {action.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </article>
            </section>

            <section className="ap-panel p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="ap-eyebrow">Cursos recientes</p>

                        <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                            Cursos disponibles para captura
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            Se muestran hasta cinco cursos asignados recientemente.
                        </p>
                    </div>

                    <Link href="/teacher/courses" className="ap-button-secondary">
                        Ver todos
                    </Link>
                </div>

                {latestCourses.length === 0 ? (
                    <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                        No tienes cursos asignados todavía. Dirección debe crear el curso y
                        asignarte como docente.
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Curso</th>
                                    <th className="px-4 py-3 font-semibold">Grupo</th>
                                    <th className="px-4 py-3 font-semibold">Ciclo</th>
                                    <th className="px-4 py-3 font-semibold">Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {latestCourses.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {course.subjectCode} · {course.subjectName}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {course.groupCode} · {course.groupName}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text-soft)]">
                                            {course.cycleCode} · {course.cycleName}
                                        </td>

                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/teacher/courses/${course.id}`}
                                                className="font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                                            >
                                                Abrir curso
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