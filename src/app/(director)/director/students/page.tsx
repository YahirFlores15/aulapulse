"use client";

import { TrafficLightBadge } from "@/components/risk/traffic-light-badge";
import { TrafficLightCausesList } from "@/components/risk/traffic-light-causes-list";
import type { TrafficLight } from "@/shared/enums/traffic-light";
import { useEffect, useMemo, useState } from "react";

type TrafficLightFilter = TrafficLight | "NONE" | "";

type Group = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
};

type TrafficLightCause = {
    type: "ATTENDANCE" | "GRADE" | "INCIDENT";
    severity: "RED" | "YELLOW";
    message: string;
    courseId?: number;
    subjectId?: number | null;
    subjectCode?: string | null;
    subjectName?: string | null;
    incidentId?: number;
    value?: number | string | null;
    metadata?: Record<string, string | number | boolean | null>;
};

type Student = {
    id: number;
    controlNumber: string;
    firstName: string;
    lastName: string;
    secondLastName: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    trafficLight: TrafficLight | null;
    trafficLightCauses: TrafficLightCause[];
    trafficLightCalculatedAt: string | null;
    redCausesCount: number;
    yellowCausesCount: number;
    createdAt: string;
    updatedAt: string;
};

type GroupStudent = {
    id: number;
    cycleId: number;
    cycleCode: string;
    groupId: number;
    groupCode: string;
    studentId: number;
    controlNumber: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    trafficLight: TrafficLight | null;
    trafficLightCauses: TrafficLightCause[];
    trafficLightCalculatedAt: string | null;
    redCausesCount: number;
    yellowCausesCount: number;
    assignedAt: string;
};

type CreateStudentForm = {
    controlNumber: string;
    firstName: string;
    lastName: string;
    secondLastName: string;
    email: string;
    phone: string;
    groupId: string;
};

type StudentImportError = {
    rowNumber: number;
    field: string;
    message: string;
};

type StudentImportDuplicate = {
    rowNumber: number;
    controlNumber: string;
    reason: "DUPLICATE_IN_FILE" | "DUPLICATE_IN_DATABASE";
    message: string;
};

type StudentImportResult = {
    groupId: number;
    groupCode: string;
    groupName: string;
    cycleId: number;
    totalRows: number;
    createdStudents: number;
    assignedStudents: number;
    duplicateStudents: number;
    failedRows: number;
    importedStudents: Array<{
        rowNumber: number;
        studentId: number;
        controlNumber: string;
    }>;
    duplicates: StudentImportDuplicate[];
    errors: StudentImportError[];
};

const initialForm: CreateStudentForm = {
    controlNumber: "",
    firstName: "",
    lastName: "",
    secondLastName: "",
    email: "",
    phone: "",
    groupId: "",
};

const trafficLightFilterLabels: Record<Exclude<TrafficLightFilter, "">, string> = {
    RED: "Rojo",
    YELLOW: "Amarillo",
    GREEN: "Verde",
    NONE: "Sin cálculo",
};

function buildStudentsQuery(params: {
    groupId?: string;
    trafficLight?: TrafficLightFilter;
}) {
    const searchParams = new URLSearchParams();

    if (params.groupId) {
        searchParams.set("groupId", params.groupId);
    }

    if (params.trafficLight) {
        searchParams.set("trafficLight", params.trafficLight);
    }

    const query = searchParams.toString();

    return query ? `/api/director/students?${query}` : "/api/director/students";
}

function formatCalculatedAt(value: string | null) {
    if (!value) {
        return "Sin cálculo";
    }

    return value;
}

function buildFullName(student: Student) {
    return [student.firstName, student.lastName, student.secondLastName]
        .filter(Boolean)
        .join(" ");
}

function getGroupDisplayName(group: Group) {
    return `${group.cycleCode} - ${group.code} - ${group.name}`;
}

function getStudentRiskSummary(students: Student[]) {
    return students.reduce(
        (acc, student) => {
            if (student.trafficLight === "RED") acc.red += 1;
            if (student.trafficLight === "YELLOW") acc.yellow += 1;
            if (student.trafficLight === "GREEN") acc.green += 1;
            if (!student.trafficLight) acc.none += 1;

            return acc;
        },
        {
            red: 0,
            yellow: 0,
            green: 0,
            none: 0,
        },
    );
}

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="ap-panel-muted p-5 text-sm">
            <p className="font-semibold text-[var(--color-text)]">{title}</p>
            <p className="mt-2 leading-6 text-[var(--color-text-soft)]">
                {description}
            </p>
        </div>
    );
}

function ImportResultSummary({
    result,
}: {
    result: StudentImportResult;
}) {
    return (
        <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
                <p className="text-xs text-[var(--color-text-faint)]">
                    Filas procesadas
                </p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                    {result.totalRows}
                </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Alumnos creados</p>
                <p className="mt-1 text-xl font-semibold text-emerald-900">
                    {result.createdStudents}
                </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-700">Duplicados ignorados</p>
                <p className="mt-1 text-xl font-semibold text-amber-900">
                    {result.duplicateStudents}
                </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs text-red-700">Errores</p>
                <p className="mt-1 text-xl font-semibold text-red-900">
                    {result.failedRows}
                </p>
            </div>
        </div>
    );
}

export default function DirectorStudentsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [trafficLightFilter, setTrafficLightFilter] = useState<TrafficLightFilter>("");
    const [form, setForm] = useState<CreateStudentForm>(initialForm);

    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingGroupStudents, setLoadingGroupStudents] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [importGroupId, setImportGroupId] = useState("");
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState("");
    const [importSuccess, setImportSuccess] = useState("");
    const [importValidationErrors, setImportValidationErrors] = useState<
        StudentImportError[]
    >([]);
    const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);

    async function loadGroups() {
        setLoadingGroups(true);

        try {
            const response = await fetch("/api/director/groups", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar los grupos");
            }

            setGroups(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar grupos");
        } finally {
            setLoadingGroups(false);
        }
    }

    async function loadStudents(nextTrafficLightFilter = trafficLightFilter) {
        setLoadingStudents(true);

        try {
            const response = await fetch(
                buildStudentsQuery({
                    trafficLight: nextTrafficLightFilter,
                }),
                {
                    cache: "no-store",
                },
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar los alumnos");
            }

            setStudents(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar alumnos");
        } finally {
            setLoadingStudents(false);
        }
    }

    async function loadStudentsByGroup(
        groupId: string,
        nextTrafficLightFilter = trafficLightFilter,
    ) {
        if (!groupId) {
            setGroupStudents([]);
            return;
        }

        setLoadingGroupStudents(true);

        try {
            const response = await fetch(
                buildStudentsQuery({
                    groupId,
                    trafficLight: nextTrafficLightFilter,
                }),
                {
                    cache: "no-store",
                },
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo cargar el grupo");
            }

            setGroupStudents(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al filtrar alumnos");
        } finally {
            setLoadingGroupStudents(false);
        }
    }

    useEffect(() => {
        void loadGroups();
        void loadStudents("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void loadStudentsByGroup(selectedGroupId, trafficLightFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGroupId, trafficLightFilter]);

    useEffect(() => {
        void loadStudents(trafficLightFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trafficLightFilter]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/director/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    controlNumber: form.controlNumber,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    secondLastName: form.secondLastName,
                    email: form.email,
                    phone: form.phone,
                    groupId: Number(form.groupId),
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo crear el alumno");
            }

            setForm(initialForm);
            setSuccess("Alumno creado correctamente.");
            await loadStudents();

            if (selectedGroupId) {
                await loadStudentsByGroup(selectedGroupId);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear alumno");
        } finally {
            setSaving(false);
        }
    }

    async function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setImporting(true);
        setImportError("");
        setImportSuccess("");
        setImportValidationErrors([]);
        setImportResult(null);

        try {
            if (!importGroupId) {
                throw new Error("Selecciona un grupo destino para la importación.");
            }

            if (!importFile) {
                throw new Error("Selecciona un archivo Excel para importar.");
            }

            const formData = new FormData();
            formData.append("groupId", importGroupId);
            formData.append("file", importFile);

            const response = await fetch("/api/director/students/import", {
                method: "POST",
                body: formData,
            });

            const json = await response.json();

            if (!response.ok) {
                setImportValidationErrors(
                    json?.data?.errors ??
                    json?.details?.fieldErrors?.rows ??
                    json?.details?.errors ??
                    [],
                );
                setImportResult(json?.data ?? null);
                throw new Error(json?.error ?? "No se pudo importar el archivo");
            }

            const result = json.data as StudentImportResult;

            setImportResult(result);
            setImportSuccess(
                `Importación completada. ${result.createdStudents} alumnos creados, ${result.assignedStudents} asignados y ${result.duplicateStudents} duplicados ignorados.`,
            );

            setImportFile(null);
            setFileInputKey((prev) => prev + 1);
            setSelectedGroupId(importGroupId);

            await loadStudents();
            await loadStudentsByGroup(importGroupId);
        } catch (err) {
            setImportError(err instanceof Error ? err.message : "Error al importar alumnos");
        } finally {
            setImporting(false);
        }
    }

    const selectedGroupName = useMemo(() => {
        if (!selectedGroupId) return "";
        const group = groups.find((item) => item.id === Number(selectedGroupId));
        return group ? getGroupDisplayName(group) : "";
    }, [groups, selectedGroupId]);

    const importGroupName = useMemo(() => {
        if (!importGroupId) return "";
        const group = groups.find((item) => item.id === Number(importGroupId));
        return group ? getGroupDisplayName(group) : "";
    }, [groups, importGroupId]);

    const riskSummary = useMemo(() => getStudentRiskSummary(students), [students]);

    const activeFilterLabel = trafficLightFilter
        ? trafficLightFilterLabels[trafficLightFilter]
        : "Todos";

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Alumnos</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                            Registro y consulta de alumnos
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Registra alumnos manualmente o impórtalos desde Excel. Después puedes
                            consultar por grupo y semáforo para detectar alumnos que requieren
                            atención. El sistema calcula riesgo desde asistencia, calificaciones e
                            incidencias, no desde presentimientos glorificados.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <span className="ap-badge ap-badge-neutral">
                            Alumnos visibles: {students.length}
                        </span>

                        <span className="ap-badge ap-badge-brand">
                            Filtro actual: {activeFilterLabel}
                        </span>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs text-red-700">Riesgo rojo</p>
                        <p className="mt-1 text-xl font-semibold text-red-900">
                            {riskSummary.red}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs text-amber-700">Riesgo amarillo</p>
                        <p className="mt-1 text-xl font-semibold text-amber-900">
                            {riskSummary.yellow}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs text-emerald-700">Sin riesgo</p>
                        <p className="mt-1 text-xl font-semibold text-emerald-900">
                            {riskSummary.green}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-700">Sin cálculo</p>
                        <p className="mt-1 text-xl font-semibold text-zinc-900">
                            {riskSummary.none}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Registrar alumno manualmente
                    </h3>

                    <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                        Útil para altas individuales. Para listas completas, usa la importación.
                        Sí, Excel sigue vivo. Nadie sabe por qué, pero aquí estamos.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="ap-field">
                            <label className="ap-label">Número de control</label>
                            <input
                                className="ap-input"
                                value={form.controlNumber}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        controlNumber: e.target.value,
                                    }))
                                }
                                placeholder="20260001"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Nombre</label>
                            <input
                                className="ap-input"
                                value={form.firstName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        firstName: e.target.value,
                                    }))
                                }
                                placeholder="Yahir"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Apellido paterno</label>
                            <input
                                className="ap-input"
                                value={form.lastName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        lastName: e.target.value,
                                    }))
                                }
                                placeholder="Flores"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Apellido materno</label>
                            <input
                                className="ap-input"
                                value={form.secondLastName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        secondLastName: e.target.value,
                                    }))
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Correo</label>
                            <input
                                type="email"
                                className="ap-input"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Teléfono</label>
                            <input
                                className="ap-input"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                    }))
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="ap-field md:col-span-2">
                            <label className="ap-label">Grupo</label>
                            <select
                                className="ap-select"
                                value={form.groupId}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        groupId: e.target.value,
                                    }))
                                }
                                required
                                disabled={loadingGroups}
                            >
                                <option value="">Selecciona un grupo</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {getGroupDisplayName(group)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            {error ? (
                                <div className="ap-message ap-message-error">{error}</div>
                            ) : null}

                            {success ? (
                                <div className="ap-message ap-message-success">
                                    {success}
                                </div>
                            ) : null}
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={saving || loadingGroups}
                                className="ap-button-primary"
                            >
                                {saving ? "Guardando..." : "Registrar alumno"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Importación masiva desde Excel
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Sube un archivo <strong>.xlsx</strong> o <strong>.xls</strong>. El orden
                        de columnas no importa; el sistema lee encabezados.
                    </p>

                    <div className="mt-4 rounded-3xl border border-[var(--color-border)] bg-white/70 p-4 text-sm text-[var(--color-text-soft)]">
                        <p className="font-semibold text-[var(--color-text)]">
                            Columnas aceptadas
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {[
                                "controlNumber",
                                "firstName",
                                "lastName",
                                "secondLastName",
                                "email",
                                "phone",
                            ].map((column) => (
                                <span key={column} className="ap-badge ap-badge-neutral">
                                    {column}
                                </span>
                            ))}
                        </div>

                        <p className="mt-3 leading-6">
                            También acepta alias como nombre, apellido paterno, correo y teléfono.
                        </p>
                    </div>

                    <form onSubmit={handleImportSubmit} className="mt-6 grid gap-4">
                        <div className="ap-field">
                            <label className="ap-label">Grupo destino</label>
                            <select
                                className="ap-select"
                                value={importGroupId}
                                onChange={(e) => setImportGroupId(e.target.value)}
                                disabled={loadingGroups || importing}
                                required
                            >
                                <option value="">Selecciona un grupo</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {getGroupDisplayName(group)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Archivo Excel</label>
                            <input
                                key={fileInputKey}
                                type="file"
                                accept=".xlsx,.xls"
                                className="ap-input"
                                onChange={(e) => {
                                    const nextFile = e.target.files?.[0] ?? null;
                                    setImportFile(nextFile);
                                }}
                                disabled={importing}
                                required
                            />
                        </div>

                        {importGroupName ? (
                            <div className="ap-panel-muted px-4 py-3 text-sm text-[var(--color-text-soft)]">
                                Grupo destino:{" "}
                                <span className="font-medium text-[var(--color-text)]">
                                    {importGroupName}
                                </span>
                            </div>
                        ) : null}

                        {importError ? (
                            <div className="ap-message ap-message-error">{importError}</div>
                        ) : null}

                        {importSuccess ? (
                            <div className="ap-message ap-message-success">
                                {importSuccess}
                            </div>
                        ) : null}

                        {importResult ? (
                            <ImportResultSummary result={importResult} />
                        ) : null}

                        {importResult?.duplicates &&
                            importResult.duplicates.length > 0 ? (
                            <div className="ap-panel-muted px-4 py-4">
                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                    Duplicados ignorados
                                </p>

                                <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
                                    {importResult.duplicates.map((item, index) => (
                                        <li
                                            key={`${item.rowNumber}-${item.controlNumber}-${index}`}
                                        >
                                            <span className="font-medium text-[var(--color-text)]">
                                                Fila {item.rowNumber}
                                            </span>{" "}
                                            · {item.controlNumber} · {item.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {importValidationErrors.length > 0 ? (
                            <div className="ap-panel-muted px-4 py-4">
                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                    Errores detectados en el archivo
                                </p>

                                <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
                                    {importValidationErrors.map((item, index) => (
                                        <li key={`${item.rowNumber}-${item.field}-${index}`}>
                                            <span className="font-medium text-[var(--color-text)]">
                                                Fila {item.rowNumber}
                                            </span>{" "}
                                            · {item.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={importing || loadingGroups}
                            className="ap-button-primary"
                        >
                            {importing ? "Importando..." : "Importar alumnos"}
                        </button>
                    </form>
                </div>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="ap-eyebrow">Consulta por grupo</p>

                        <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                            Alumnos asignados
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Filtra por grupo y semáforo para ubicar rápidamente alumnos en
                            seguimiento.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                        <select
                            className="ap-select w-full md:w-auto"
                            value={trafficLightFilter}
                            onChange={(e) =>
                                setTrafficLightFilter(e.target.value as TrafficLightFilter)
                            }
                        >
                            <option value="">Todos los semáforos</option>
                            <option value="RED">Rojo</option>
                            <option value="YELLOW">Amarillo</option>
                            <option value="GREEN">Verde</option>
                            <option value="NONE">Sin cálculo</option>
                        </select>

                        <select
                            className="ap-select w-full md:w-auto"
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            disabled={loadingGroups}
                        >
                            <option value="">Selecciona un grupo</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {getGroupDisplayName(group)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedGroupId ? (
                    <div className="ap-panel-muted mb-4 px-4 py-3 text-sm text-[var(--color-text-soft)]">
                        Grupo seleccionado:{" "}
                        <span className="font-medium text-[var(--color-text)]">
                            {selectedGroupName}
                        </span>
                    </div>
                ) : null}

                {!selectedGroupId ? (
                    <EmptyState
                        title="Selecciona un grupo"
                        description="Elige un grupo para consultar sus alumnos asignados y revisar su semáforo académico."
                    />
                ) : loadingGroupStudents ? (
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Cargando alumnos del grupo...
                    </p>
                ) : groupStudents.length === 0 ? (
                    <EmptyState
                        title="Sin coincidencias"
                        description="No hay alumnos en este grupo que coincidan con el filtro seleccionado."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Alumno
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Contacto
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Semáforo
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Causas principales
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {groupStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-3 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {student.fullName}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                Control: {student.controlNumber}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                Último cálculo:{" "}
                                                {formatCalculatedAt(
                                                    student.trafficLightCalculatedAt,
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-3 py-4 text-[var(--color-text-soft)]">
                                            <p>{student.email ?? "Sin correo"}</p>
                                            <p className="mt-1 text-xs">
                                                {student.phone ?? "Sin teléfono"}
                                            </p>
                                        </td>

                                        <td className="px-3 py-4">
                                            <TrafficLightBadge
                                                color={student.trafficLight}
                                                size="sm"
                                            />
                                        </td>

                                        <td className="min-w-[280px] px-3 py-4">
                                            <TrafficLightCausesList
                                                causes={student.trafficLightCauses}
                                                maxItems={2}
                                                emptyText="Sin causas."
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="ap-panel p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="ap-eyebrow">Listado general</p>

                        <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                            Todos los alumnos
                        </h3>

                        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                            Este listado respeta el filtro de semáforo seleccionado.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadStudents()}
                        className="ap-button-secondary"
                    >
                        Recargar
                    </button>
                </div>

                {loadingStudents ? (
                    <p className="text-sm text-[var(--color-text-soft)]">
                        Cargando alumnos...
                    </p>
                ) : students.length === 0 ? (
                    <EmptyState
                        title="No hay alumnos para mostrar"
                        description="Registra alumnos manualmente o importa una lista desde Excel para comenzar."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-left">
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Alumno
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Contacto
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Estado
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Semáforo
                                    </th>
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text-soft)]">
                                        Causas principales
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-3 py-4">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {buildFullName(student)}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                Control: {student.controlNumber}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                                                Último cálculo:{" "}
                                                {formatCalculatedAt(
                                                    student.trafficLightCalculatedAt,
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-3 py-4 text-[var(--color-text-soft)]">
                                            <p>{student.email ?? "Sin correo"}</p>
                                            <p className="mt-1 text-xs">
                                                {student.phone ?? "Sin teléfono"}
                                            </p>
                                        </td>

                                        <td className="px-3 py-4">
                                            <span
                                                className={
                                                    student.isActive
                                                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                                                        : "inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700"
                                                }
                                            >
                                                {student.isActive ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>

                                        <td className="px-3 py-4">
                                            <TrafficLightBadge
                                                color={student.trafficLight}
                                                size="sm"
                                            />
                                        </td>

                                        <td className="min-w-[280px] px-3 py-4">
                                            <TrafficLightCausesList
                                                causes={student.trafficLightCauses}
                                                maxItems={2}
                                                emptyText="Sin causas."
                                            />
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