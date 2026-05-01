import { TeacherService } from "@/server/domains/teacher/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import Link from "next/link";


export default async function TeacherCoursesPage() {
    const session = await requireRolePageAccess(ROLE.TEACHER);

    const service = new TeacherService();
    const courses = service.listCourses(session.userId);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Docente</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold text-[var(--color-text)]">
                            Mis cursos
                        </h1>

                        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                            Aquí ves únicamente los cursos donde tú eres el docente asignado.
                            Desde cada curso puedes entrar a asistencia, calificaciones e
                            incidencias. Nada de revisar grupos ajenos por curiosidad
                            institucional. El espionaje administrativo no cuenta como feature.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-sm text-[var(--color-text-soft)]">
                            Cursos asignados
                        </p>

                        <p className="mt-2 text-4xl font-semibold text-[var(--color-text)]">
                            {courses.length}
                        </p>
                    </div>
                </div>
            </section>

            <section className="ap-panel p-6">
                {courses.length === 0 ? (
                    <div className="ap-panel-muted p-6 text-sm text-[var(--color-text-soft)]">
                        No tienes cursos asignados todavía. Dirección debe relacionar ciclo,
                        grupo, materia y docente para que aparezcan aquí.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {courses.map((course) => (
                            <article key={course.id} className="ap-panel-muted p-5">
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="ap-badge ap-badge-brand">
                                                {course.cycleCode}
                                            </span>

                                            <span className="ap-badge ap-badge-neutral">
                                                Grupo {course.groupCode}
                                            </span>
                                        </div>

                                        <h2 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                                            {course.subjectCode} · {course.subjectName}
                                        </h2>

                                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                            Ciclo: {course.cycleName}
                                        </p>

                                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                            Grupo: {course.groupCode} · {course.groupName}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href={`/teacher/courses/${course.id}`}
                                            className="ap-button-secondary"
                                        >
                                            Resumen
                                        </Link>

                                        <Link
                                            href={`/teacher/courses/${course.id}/attendance`}
                                            className="ap-button-primary"
                                        >
                                            Asistencia
                                        </Link>

                                        <Link
                                            href={`/teacher/courses/${course.id}/grades`}
                                            className="ap-button-primary"
                                        >
                                            Calificaciones
                                        </Link>

                                        <Link
                                            href={`/teacher/courses/${course.id}/incidents`}
                                            className="ap-button-primary"
                                        >
                                            Incidencias
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