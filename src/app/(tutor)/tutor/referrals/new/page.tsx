"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TutorGroup = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
    tutorUserId: number;
    tutorName: string;
};

type TutorStudent = {
    studentId: number;
    controlNumber: string;
    fullName: string;
    groupId: number;
    groupCode: string;
    cycleId: number;
    subjects: Array<{
        courseId: number | null;
        subjectId: number | null;
        subjectCode: string;
        subjectName: string;
        teacherUserId: number | null;
        teacherName: string | null;
        riskStatus: "GREEN" | "YELLOW" | "RED" | null;
        isIncomplete: boolean;
    }>;
};

type GroupsResponse = {
    items: TutorGroup[];
};

type GroupStudentsResponse = {
    group: TutorGroup;
    students: TutorStudent[];
};

type ReferralsResponse = {
    items: Array<unknown>;
    reasons: Array<{
        code: string;
        name: string;
        isActive: boolean;
    }>;
};

type TargetArea = "PEDAGOGY" | "PSYCHOLOGY";

export default function NewTutorReferralPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialGroupId = searchParams.get("groupId") ?? "";
    const initialStudentId = searchParams.get("studentId") ?? "";

    const [groups, setGroups] = useState<TutorGroup[]>([]);
    const [students, setStudents] = useState<TutorStudent[]>([]);
    const [reasons, setReasons] = useState<ReferralsResponse["reasons"]>([]);

    const [groupId, setGroupId] = useState(initialGroupId);
    const [studentId, setStudentId] = useState(initialStudentId);
    const [reasonCode, setReasonCode] = useState("");
    const [summary, setSummary] = useState("");
    const [targetArea, setTargetArea] = useState<TargetArea>("PEDAGOGY");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [groupLoading, setGroupLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadBaseData() {
            try {
                setLoading(true);
                setError("");

                const [groupsResponse, referralsResponse] = await Promise.all([
                    fetch("/api/tutor/groups", { cache: "no-store" }),
                    fetch("/api/tutor/referrals", { cache: "no-store" }),
                ]);

                if (!groupsResponse.ok) {
                    throw new Error("No se pudieron cargar los grupos.");
                }

                if (!referralsResponse.ok) {
                    throw new Error("No se pudieron cargar los motivos de canalización.");
                }

                const groupsJson = (await groupsResponse.json()) as GroupsResponse;
                const referralsJson = (await referralsResponse.json()) as ReferralsResponse;

                setGroups(groupsJson.items);
                setReasons(referralsJson.reasons.filter((reason) => reason.isActive));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al cargar datos.");
            } finally {
                setLoading(false);
            }
        }

        void loadBaseData();
    }, []);

    useEffect(() => {
        async function loadStudents() {
            if (!groupId) {
                setStudents([]);
                setStudentId("");
                return;
            }

            try {
                setGroupLoading(true);
                setError("");

                const response = await fetch(`/api/tutor/groups/${groupId}/students`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("No se pudieron cargar los alumnos del grupo.");
                }

                const json = (await response.json()) as GroupStudentsResponse;
                setStudents(json.students);

                if (
                    initialStudentId &&
                    json.students.some(
                        (student) => String(student.studentId) === initialStudentId,
                    )
                ) {
                    setStudentId(initialStudentId);
                    return;
                }

                setStudentId((current) =>
                    json.students.some((student) => String(student.studentId) === current)
                        ? current
                        : "",
                );
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al cargar alumnos.");
            } finally {
                setGroupLoading(false);
            }
        }

        void loadStudents();
    }, [groupId, initialStudentId]);

    const selectedStudent = useMemo(
        () => students.find((student) => String(student.studentId) === studentId) ?? null,
        [students, studentId],
    );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const response = await fetch("/api/tutor/referrals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: Number(studentId),
                    groupId: Number(groupId),
                    reasonCode,
                    summary,
                    targetArea,
                    sharedWithSupport: true,
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo crear la canalización.");
            }

            setSuccess("Canalización creada correctamente.");
            router.push(`/tutor/referrals/${json.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear la canalización.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="ap-panel p-6">
                <p className="text-sm text-[var(--color-text-soft)]">
                    Cargando formulario...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Tutor</p>

                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Nueva canalización
                </h2>

                <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                    Abre un caso para un alumno de tus grupos con área destino explícita desde el
                    inicio. Porque mandar casos sin destino era básicamente aventarlos al monte.
                </p>
            </section>

            <section className="ap-panel p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="ap-field">
                            <label className="ap-label">Grupo</label>
                            <select
                                value={groupId}
                                onChange={(event) => setGroupId(event.target.value)}
                                className="ap-select"
                                required
                            >
                                <option value="">Selecciona un grupo</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.code} · {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Alumno</label>
                            <select
                                value={studentId}
                                onChange={(event) => setStudentId(event.target.value)}
                                className="ap-select"
                                required
                                disabled={!groupId || groupLoading}
                            >
                                <option value="">
                                    {groupLoading ? "Cargando alumnos..." : "Selecciona un alumno"}
                                </option>

                                {students.map((student) => (
                                    <option key={student.studentId} value={student.studentId}>
                                        {student.fullName} · {student.controlNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="ap-field">
                            <label className="ap-label">Motivo</label>
                            <select
                                value={reasonCode}
                                onChange={(event) => setReasonCode(event.target.value)}
                                className="ap-select"
                                required
                            >
                                <option value="">Selecciona un motivo</option>
                                {reasons.map((reason) => (
                                    <option key={reason.code} value={reason.code}>
                                        {reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Área destino</label>
                            <select
                                value={targetArea}
                                onChange={(event) =>
                                    setTargetArea(event.target.value as TargetArea)
                                }
                                className="ap-select"
                                required
                            >
                                <option value="PEDAGOGY">Pedagogía</option>
                                <option value="PSYCHOLOGY">Psicología</option>
                            </select>
                        </div>
                    </div>

                    <div className="ap-field">
                        <label className="ap-label">Resumen del caso</label>
                        <textarea
                            value={summary}
                            onChange={(event) => setSummary(event.target.value)}
                            className="ap-textarea min-h-36"
                            placeholder="Describe el motivo de la canalización, contexto y observaciones relevantes."
                            required
                        />
                    </div>

                    {selectedStudent ? (
                        <div className="ap-panel-muted p-4">
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                                Alumno seleccionado
                            </p>

                            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                {selectedStudent.fullName} · {selectedStudent.controlNumber}
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                Materias detectadas: {selectedStudent.subjects.length}
                            </p>
                        </div>
                    ) : null}

                    <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4 text-sm leading-6 text-[var(--color-text-soft)]">
                        La canalización será enviada al área seleccionada y quedará visible para
                        seguimiento según permisos del flujo. Sin casillas ambiguas, porque ya
                        tuvimos suficiente folklore administrativo.
                    </div>

                    {error ? (
                        <div className="ap-message ap-message-error">{error}</div>
                    ) : null}

                    {success ? (
                        <div className="ap-message ap-message-success">{success}</div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="ap-button-primary"
                    >
                        {submitting ? "Guardando..." : "Crear canalización"}
                    </button>
                </form>
            </section>
        </div>
    );
}