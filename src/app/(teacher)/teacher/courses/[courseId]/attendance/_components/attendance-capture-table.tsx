import type { TeacherCourseStudentDto } from "@/shared/dtos/teacher/courses.dto";
import type { AttendanceStatus } from "@/shared/enums/attendance";


type AttendanceCaptureTableProps = {
    students: TeacherCourseStudentDto[];
    statuses: Record<number, AttendanceStatus>;
    disabled: boolean;
    saving: boolean;
    onStatusChange: (studentId: number, status: AttendanceStatus) => void;
    onSubmit: () => void;
};

const attendanceStatusLabels: Record<AttendanceStatus, string> = {
    PRESENT: "Presente",
    ABSENT: "Falta",
    LATE: "Retardo",
};

const attendanceStatusOptions: AttendanceStatus[] = [
    "PRESENT",
    "ABSENT",
    "LATE",
];

function getStatusBadgeClassName(status: AttendanceStatus) {
    if (status === "PRESENT") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "LATE") {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    return "border-rose-200 bg-rose-50 text-rose-800";
}

export function AttendanceCaptureTable({
    students,
    statuses,
    disabled,
    saving,
    onStatusChange,
    onSubmit,
}: AttendanceCaptureTableProps) {
    const canRenderTable = students.length > 0;

    const summary = students.reduce(
        (acc, student) => {
            const status = statuses[student.studentId] ?? "PRESENT";

            if (status === "PRESENT") acc.present += 1;
            if (status === "ABSENT") acc.absent += 1;
            if (status === "LATE") acc.late += 1;

            return acc;
        },
        {
            present: 0,
            absent: 0,
            late: 0,
        },
    );

    return (
        <section className="ap-panel p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="ap-eyebrow">Captura diaria</p>

                    <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Lista de asistencia
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        Marca un único estado por alumno para el día actual. La captura
                        queda bloqueada si hoy no es día hábil o si el curso fue marcado como
                        “no aplica”. Porque sí, por una vez el sistema evita que alguien capture
                        asistencia en el limbo.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={disabled || saving || !canRenderTable}
                    className="ap-button-primary"
                >
                    {saving ? "Guardando..." : "Guardar asistencia"}
                </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-700">Presentes</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-900">
                        {summary.present}
                    </p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs text-rose-700">Faltas</p>
                    <p className="mt-1 text-xl font-semibold text-rose-900">
                        {summary.absent}
                    </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs text-amber-700">Retardos</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">
                        {summary.late}
                    </p>
                </div>
            </div>

            {disabled ? (
                <div className="ap-panel-muted mt-5 p-4 text-sm leading-6 text-[var(--color-text-soft)]">
                    La captura está bloqueada para este día. Puede ser por día no hábil o
                    porque el curso fue marcado como no aplica.
                </div>
            ) : null}

            {!canRenderTable ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Este curso no tiene alumnos asignados.
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">No. control</th>
                                <th className="px-4 py-3 font-semibold">Alumno</th>
                                <th className="px-4 py-3 font-semibold">Estado actual</th>
                                <th className="px-4 py-3 font-semibold">Captura</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => {
                                const currentStatus =
                                    statuses[student.studentId] ?? "PRESENT";

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

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(
                                                    currentStatus,
                                                )}`}
                                            >
                                                {attendanceStatusLabels[currentStatus]}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <select
                                                value={currentStatus}
                                                onChange={(event) =>
                                                    onStatusChange(
                                                        student.studentId,
                                                        event.target.value as AttendanceStatus,
                                                    )
                                                }
                                                disabled={disabled || saving}
                                                className="ap-select min-w-[180px]"
                                            >
                                                {attendanceStatusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {attendanceStatusLabels[status]}
                                                    </option>
                                                ))}
                                            </select>
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