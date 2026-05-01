import { TeacherService, TeacherServiceError } from "@/server/domains/teacher/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import { notFound } from "next/navigation";
import Link from "next/link";


type CoursePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

function getRiskLabel(value: "GREEN" | "YELLOW" | "RED" | null) {
    if (value === "GREEN") return "Verde";
    if (value === "YELLOW") return "Amarillo";
    if (value === "RED") return "Rojo";
    return "Pendiente";
}

function getRiskBadgeClass(value: "GREEN" | "YELLOW" | "RED" | null) {
    if (value === "GREEN") return "bg-emerald-100 text-emerald-800";
    if (value === "YELLOW") return "bg-amber-100 text-amber-800";
    if (value === "RED") return "bg-rose-100 text-rose-800";
    return "bg-slate-100 text-slate-700";
}

function getCaptureStatusLabel(input: {
    configuredUnitsCount: number;
    completeStudentsCount: number;
    totalStudents: number;
}) {
    if (input.configuredUnitsCount === 0) {
        return {
            label: "Sin configurar",
            className: "bg-amber-100 text-amber-800",
        };
    }

    if (
        input.totalStudents > 0 &&
        input.completeStudentsCount === input.totalStudents
    ) {
        return {
            label: "Completa",
            className: "bg-emerald-100 text-emerald-800",
        };
    }

    return {
        label: "En progreso",
        className: "bg-sky-100 text-sky-800",
    };
}

export default async function TeacherCourseDetailPage({
    params,
}: CoursePageProps) {
    const session = await requireRolePageAccess(ROLE.TEACHER);
    const resolvedParams = await params;
    const courseId = Number(resolvedParams.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
        notFound();
    }

    const service = new TeacherService();

    try {
        const [studentsResult, gradeUnitsResult, gradesResult] = await Promise.all([
            Promise.resolve(service.getCourseStudents(session.userId, courseId)),
            Promise.resolve(service.getGradeUnits(session.userId, courseId)),
            Promise.resolve(service.getGrades(session.userId, courseId)),
        ]);

        const configuredUnitsCount = gradeUnitsResult.units.length;
        const completeStudentsCount = gradesResult.summary.filter(
            (student) => student.isComplete,
        ).length;

        const captureStatus = getCaptureStatusLabel({
            configuredUnitsCount,
            completeStudentsCount,
            totalStudents: studentsResult.students.length,
        });

        return (
            <div className="space-y-8">
                <section className="ap-panel p-8">
                    <Link
                        href="/teacher/courses"
                        className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                    >
                        ← Volver a cursos
                    </Link>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                        <div>
                            <p className="ap-eyebrow">Curso</p>

                            <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                                {studentsResult.course.subjectCode} · {studentsResult.course.subjectName}
                            </h1>

                            <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                                Este curso concentra la captura académica del grupo asignado:
                                asistencia diaria, unidades de evaluación, calificaciones e
                                incidencias. Básicamente, el lugar donde los datos dejan de ser
                                buenas intenciones y empiezan a servir para algo.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                                Contexto del curso
                            </p>

                            <div className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
                                <p>
                                    Ciclo:{" "}
                                    <span className="font-medium text-[var(--color-text)]">
                                        {studentsResult.course.cycleCode} · {studentsResult.course.cycleName}
                                    </span>
                                </p>

                                <p>
                                    Grupo:{" "}
                                    <span className="font-medium text-[var(--color-text)]">
                                        {studentsResult.course.groupCode} · {studentsResult.course.groupName}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/teacher/courses/${studentsResult.course.id}/attendance`}
                            className="ap-button-primary"
                        >
                            Capturar asistencia
                        </Link>

                        <Link
                            href={`/teacher/courses/${studentsResult.course.id}/grades`}
                            className="ap-button-primary"
                        >
                            Calificaciones
                        </Link>

                        <Link
                            href={`/teacher/courses/${studentsResult.course.id}/incidents`}
                            className="ap-button-primary"
                        >
                            Registrar incidencias
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <article className="ap-panel p-6">
                        <p className="text-sm text-[var(--color-text-soft)]">Alumnos</p>

                        <p className="mt-3 text-4xl font-semibold text-[var(--color-text)]">
                            {studentsResult.students.length}
                        </p>
                    </article>

                    <article className="ap-panel p-6">
                        <p className="text-sm text-[var(--color-text-soft)]">
                            Unidades configuradas
                        </p>

                        <p className="mt-3 text-4xl font-semibold text-[var(--color-text)]">
                            {configuredUnitsCount}
                        </p>
                    </article>

                    <article className="ap-panel p-6">
                        <p className="text-sm text-[var(--color-text-soft)]">
                            Alumnos completos
                        </p>

                        <p className="mt-3 text-4xl font-semibold text-[var(--color-text)]">
                            {completeStudentsCount}
                        </p>
                    </article>

                    <article className="ap-panel p-6">
                        <p className="text-sm text-[var(--color-text-soft)]">
                            Estado de captura
                        </p>

                        <div className="mt-3">
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${captureStatus.className}`}
                            >
                                {captureStatus.label}
                            </span>
                        </div>
                    </article>
                </section>

                <section className="ap-panel p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="ap-eyebrow">Resumen académico</p>

                            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                                Estado del grupo
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                Semáforo, completitud de captura y promedio final calculado.
                            </p>
                        </div>

                        <Link
                            href={`/teacher/courses/${studentsResult.course.id}/grades`}
                            className="ap-button-secondary"
                        >
                            Ir a calificaciones
                        </Link>
                    </div>

                    {studentsResult.students.length === 0 ? (
                        <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                            Este curso no tiene alumnos asignados.
                        </div>
                    ) : (
                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Alumno</th>
                                        <th className="px-4 py-3 font-semibold">Semáforo</th>
                                        <th className="px-4 py-3 font-semibold">Captura</th>
                                        <th className="px-4 py-3 font-semibold">Final</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {studentsResult.students.map((student) => {
                                        const gradeSummary =
                                            gradesResult.summary.find(
                                                (item) => item.studentId === student.studentId,
                                            ) ?? null;

                                        const finalScoreText =
                                            gradeSummary?.finalScore == null
                                                ? "Pendiente"
                                                : gradeSummary.finalScore.toFixed(2);

                                        return (
                                            <tr
                                                key={student.studentId}
                                                className="border-b border-[var(--color-border)]/70 align-top"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-[var(--color-text)]">
                                                        {student.fullName}
                                                    </p>

                                                    <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                        Control: {student.controlNumber}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(
                                                            student.riskStatus,
                                                        )}`}
                                                    >
                                                        {getRiskLabel(student.riskStatus)}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {gradeSummary?.isComplete ? (
                                                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                            Completa
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                                            Incompleta
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-[var(--color-text)]">
                                                    {finalScoreText}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        );
    } catch (error) {
        if (error instanceof TeacherServiceError && error.status === 404) {
            notFound();
        }

        if (error instanceof TeacherServiceError && error.status === 403) {
            notFound();
        }

        throw error;
    }
}