"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { AttendanceCaptureTable } from "./_components/attendance-capture-table";
import { AttendanceDayPicker } from "./_components/attendance-day-picker";
import { AttendanceWeeklySummary } from "./_components/attendance-weekly-summary";
import { NonApplicableDayPanel } from "./_components/non-applicable-day-panel";

import type { AttendanceTodayResponseDto } from "@/shared/dtos/teacher/attendance.dto";
import type { TeacherCourseStudentsResponseDto } from "@/shared/dtos/teacher/courses.dto";
import type { AttendanceStatus } from "@/shared/enums/attendance";


type AttendancePageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

type AttendanceMap = Record<number, AttendanceStatus>;

function parseCourseId(rawCourseId: string) {
    const parsed = Number(rawCourseId);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildInitialStatuses(
    students: TeacherCourseStudentsResponseDto["students"],
    attendance: AttendanceTodayResponseDto,
): AttendanceMap {
    const nextStatuses: AttendanceMap = {};

    for (const student of students) {
        nextStatuses[student.studentId] = "PRESENT";
    }

    for (const record of attendance.records) {
        nextStatuses[record.studentId] = record.status;
    }

    return nextStatuses;
}

export default function TeacherAttendancePage({ params }: AttendancePageProps) {
    const { courseId: rawCourseId } = use(params);
    const courseId = parseCourseId(rawCourseId);

    const [courseData, setCourseData] =
        useState<TeacherCourseStudentsResponseDto | null>(null);
    const [attendanceData, setAttendanceData] =
        useState<AttendanceTodayResponseDto | null>(null);
    const [statuses, setStatuses] = useState<AttendanceMap>({});
    const [nonApplicableReason, setNonApplicableReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [savingNonApplicable, setSavingNonApplicable] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function loadAttendance(targetCourseId: number) {
        const response = await fetch(
            `/api/teacher/courses/${targetCourseId}/attendance`,
            {
                cache: "no-store",
            },
        );

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.error ?? json.message ?? "No se pudo cargar la asistencia.");
        }

        return json.data as AttendanceTodayResponseDto;
    }

    useEffect(() => {
        async function loadInitialData() {
            if (!courseId) {
                setError("El curso es inválido.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [courseResponse, attendanceResult] = await Promise.all([
                    fetch(`/api/teacher/courses/${courseId}/students`, {
                        cache: "no-store",
                    }),
                    loadAttendance(courseId),
                ]);

                const courseJson = await courseResponse.json();

                if (!courseResponse.ok) {
                    throw new Error(
                        courseJson.error ?? courseJson.message ?? "No se pudo cargar el curso.",
                    );
                }

                const nextCourseData =
                    courseJson.data as TeacherCourseStudentsResponseDto;

                setCourseData(nextCourseData);
                setAttendanceData(attendanceResult);
                setStatuses(buildInitialStatuses(nextCourseData.students, attendanceResult));
                setNonApplicableReason(attendanceResult.nonApplicableDay?.reason ?? "");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al cargar asistencia.");
            } finally {
                setLoading(false);
            }
        }

        void loadInitialData();
    }, [courseId]);

    const captureDisabled = useMemo(() => {
        if (!attendanceData) return true;
        if (!attendanceData.isBusinessDay) return true;
        if (attendanceData.nonApplicableDay) return true;
        return false;
    }, [attendanceData]);

    function syncAttendanceState(
        nextAttendanceData: AttendanceTodayResponseDto,
        nextCourseData = courseData,
    ) {
        setAttendanceData(nextAttendanceData);
        setNonApplicableReason(nextAttendanceData.nonApplicableDay?.reason ?? "");

        if (!nextCourseData) {
            return;
        }

        setStatuses(buildInitialStatuses(nextCourseData.students, nextAttendanceData));
    }

    function handleStatusChange(studentId: number, status: AttendanceStatus) {
        setStatuses((prev) => ({
            ...prev,
            [studentId]: status,
        }));
    }

    async function handleSubmitAttendance() {
        if (!courseId || !courseData) return;

        setSavingAttendance(true);
        setError(null);
        setMessage(null);

        try {
            const payload = {
                records: courseData.students.map((student) => ({
                    studentId: student.studentId,
                    status: statuses[student.studentId] ?? "PRESENT",
                })),
            };

            const response = await fetch(`/api/teacher/courses/${courseId}/attendance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.error ?? json.message ?? "No se pudo guardar la asistencia.",
                );
            }

            syncAttendanceState(json.data as AttendanceTodayResponseDto);
            setMessage("Asistencia guardada correctamente.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Error al guardar la asistencia.",
            );
        } finally {
            setSavingAttendance(false);
        }
    }

    async function handleMarkNonApplicable() {
        if (!courseId) return;

        setSavingNonApplicable(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(
                `/api/teacher/courses/${courseId}/attendance/non-applicable`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reason: nonApplicableReason,
                    }),
                },
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.error ??
                    json.message ??
                    "No se pudo marcar el día como no aplica.",
                );
            }

            syncAttendanceState(json.data as AttendanceTodayResponseDto);
            setMessage("El día fue marcado como no aplica para este curso.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al marcar el día como no aplica.",
            );
        } finally {
            setSavingNonApplicable(false);
        }
    }

    async function handleUnmarkNonApplicable() {
        if (!courseId) return;

        setSavingNonApplicable(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(
                `/api/teacher/courses/${courseId}/attendance/non-applicable`,
                {
                    method: "DELETE",
                },
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.error ??
                    json.message ??
                    "No se pudo quitar la marca de no aplica.",
                );
            }

            syncAttendanceState(json.data as AttendanceTodayResponseDto);
            setMessage("La marca de no aplica fue retirada.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al quitar la marca de no aplica.",
            );
        } finally {
            setSavingNonApplicable(false);
        }
    }

    if (loading) {
        return (
            <div className="ap-panel p-6">
                <p className="text-sm text-[var(--color-text-soft)]">
                    Cargando asistencia...
                </p>
            </div>
        );
    }

    if (error && (!courseData || !attendanceData)) {
        return (
            <div className="space-y-4">
                <Link
                    href="/teacher/courses"
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver a cursos
                </Link>

                <div className="ap-message ap-message-error">{error}</div>
            </div>
        );
    }

    if (!courseData || !attendanceData || !courseId) return null;

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <Link
                    href={`/teacher/courses/${courseId}`}
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)]"
                >
                    ← Volver al curso
                </Link>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <p className="ap-eyebrow">Asistencia</p>

                        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                            {courseData.course.subjectCode} · {courseData.course.subjectName}
                        </h1>

                        <p className="mt-3 text-sm text-[var(--color-text-soft)]">
                            Grupo: {courseData.course.groupCode} · {courseData.course.groupName}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5 text-sm text-[var(--color-text-soft)]">
                        <p className="font-semibold text-[var(--color-text)]">
                            Regla de captura
                        </p>

                        <p className="mt-2 leading-6">
                            La asistencia se captura únicamente para el día actual, de lunes a
                            viernes. No hay selector libre de fecha, porque permitir editar el
                            pasado alegremente suele terminar en arqueología académica fraudulenta.
                        </p>
                    </div>
                </div>
            </section>

            {message ? (
                <div className="ap-message ap-message-success">{message}</div>
            ) : null}

            {error ? <div className="ap-message ap-message-error">{error}</div> : null}

            <AttendanceDayPicker
                dayLabel={attendanceData.dayLabel}
                date={attendanceData.date}
                isBusinessDay={attendanceData.isBusinessDay}
            />

            <NonApplicableDayPanel
                disabled={!attendanceData.isBusinessDay}
                nonApplicableDay={attendanceData.nonApplicableDay}
                reason={nonApplicableReason}
                saving={savingNonApplicable}
                onReasonChange={setNonApplicableReason}
                onMark={handleMarkNonApplicable}
                onUnmark={handleUnmarkNonApplicable}
            />

            <AttendanceCaptureTable
                students={courseData.students}
                statuses={statuses}
                disabled={captureDisabled}
                saving={savingAttendance}
                onStatusChange={handleStatusChange}
                onSubmit={handleSubmitAttendance}
            />

            <AttendanceWeeklySummary
                students={courseData.students}
                summary={attendanceData.weeklySummary}
            />
        </div>
    );
}