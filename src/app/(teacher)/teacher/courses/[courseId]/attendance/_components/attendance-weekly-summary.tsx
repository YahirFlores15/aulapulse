import type { AttendanceWeeklySummaryDto } from "@/shared/dtos/teacher/attendance.dto";
import type { TeacherCourseStudentDto } from "@/shared/dtos/teacher/courses.dto";


type AttendanceWeeklySummaryProps = {
    students: TeacherCourseStudentDto[];
    summary: AttendanceWeeklySummaryDto[];
};

function getAlertLabel(item: AttendanceWeeklySummaryDto | undefined) {
    if (!item) {
        return "Sin registros";
    }

    if (item.hasThreeConsecutiveAbsences) {
        return "3 faltas consecutivas";
    }

    if (item.absentCount >= 2) {
        return "2 faltas en semana";
    }

    if (item.lateCount >= 5) {
        return "5 retardos en semana";
    }

    return "Sin alerta";
}

function getAlertClassName(item: AttendanceWeeklySummaryDto | undefined) {
    if (!item) {
        return "border-zinc-200 bg-zinc-50 text-zinc-700";
    }

    if (item.hasThreeConsecutiveAbsences) {
        return "border-rose-200 bg-rose-50 text-rose-800";
    }

    if (item.absentCount >= 2 || item.lateCount >= 5) {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export function AttendanceWeeklySummary({
    students,
    summary,
}: AttendanceWeeklySummaryProps) {
    const summaryByStudentId = new Map(
        summary.map((item) => [item.studentId, item]),
    );

    const totals = students.reduce(
        (acc, student) => {
            const item = summaryByStudentId.get(student.studentId);

            acc.present += item?.presentCount ?? 0;
            acc.absent += item?.absentCount ?? 0;
            acc.late += item?.lateCount ?? 0;

            if (item?.hasThreeConsecutiveAbsences) {
                acc.redAlerts += 1;
            } else if ((item?.absentCount ?? 0) >= 2 || (item?.lateCount ?? 0) >= 5) {
                acc.yellowAlerts += 1;
            }

            return acc;
        },
        {
            present: 0,
            absent: 0,
            late: 0,
            redAlerts: 0,
            yellowAlerts: 0,
        },
    );

    return (
        <section className="ap-panel p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="ap-eyebrow">Resumen semanal</p>

                    <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Faltas y retardos de la semana actual
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        El cálculo considera únicamente la semana laboral actual, de lunes a
                        viernes. Sirve para detectar alertas tempranas antes de que el problema
                        llegue con mariachi y acta administrativa.
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-700">Asistencias</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-900">
                        {totals.present}
                    </p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs text-rose-700">Faltas</p>
                    <p className="mt-1 text-xl font-semibold text-rose-900">
                        {totals.absent}
                    </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs text-amber-700">Retardos</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">
                        {totals.late}
                    </p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs text-rose-700">Alertas rojas</p>
                    <p className="mt-1 text-xl font-semibold text-rose-900">
                        {totals.redAlerts}
                    </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs text-amber-700">Alertas amarillas</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">
                        {totals.yellowAlerts}
                    </p>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    No hay alumnos para resumir.
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">No. control</th>
                                <th className="px-4 py-3 font-semibold">Alumno</th>
                                <th className="px-4 py-3 font-semibold">Asistencias</th>
                                <th className="px-4 py-3 font-semibold">Faltas</th>
                                <th className="px-4 py-3 font-semibold">Retardos</th>
                                <th className="px-4 py-3 font-semibold">Alerta</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => {
                                const item = summaryByStudentId.get(student.studentId);

                                return (
                                    <tr
                                        key={student.studentId}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {student.controlNumber}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {student.fullName}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {item?.presentCount ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {item?.absentCount ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-[var(--color-text)]">
                                            {item?.lateCount ?? 0}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAlertClassName(
                                                    item,
                                                )}`}
                                            >
                                                {getAlertLabel(item)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}