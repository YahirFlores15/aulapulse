"use client";

import { useEffect, useMemo, useState } from "react";

type OperationalRole = "TEACHER" | "PEDAGOGIA" | "PSICOLOGIA";

type DirectorUser = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    mustChangePassword: boolean;
    role: OperationalRole;
    createdAt: string;
};

type CreateUserForm = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: OperationalRole;
    mustChangePassword: boolean;
};

const initialForm: CreateUserForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "TEACHER",
    mustChangePassword: true,
};

const roleLabels: Record<OperationalRole, string> = {
    TEACHER: "Docente",
    PEDAGOGIA: "Pedagogía",
    PSICOLOGIA: "Psicología",
};

const roleDescriptions: Record<OperationalRole, string> = {
    TEACHER:
        "Captura asistencia, calificaciones e incidencias en los cursos asignados.",
    PEDAGOGIA:
        "Atiende canalizaciones dirigidas al área pedagógica y da seguimiento académico.",
    PSICOLOGIA:
        "Atiende canalizaciones dirigidas al área psicológica y documenta el seguimiento.",
};

function getFullName(user: DirectorUser) {
    return `${user.firstName} ${user.lastName}`.trim();
}

function getRoleBadgeClassName(role: OperationalRole) {
    if (role === "TEACHER") {
        return "border-sky-200 bg-sky-50 text-sky-800";
    }

    if (role === "PEDAGOGIA") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    return "border-violet-200 bg-violet-50 text-violet-800";
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

export default function DirectorUsersPage() {
    const [users, setUsers] = useState<DirectorUser[]>([]);
    const [form, setForm] = useState<CreateUserForm>(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadUsers() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/director/users", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudieron cargar los usuarios");
            }

            setUsers(json.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadUsers();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/director/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error ?? "No se pudo crear el usuario");
            }

            setForm(initialForm);
            setSuccess("Usuario creado correctamente.");
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear usuario");
        } finally {
            setSaving(false);
        }
    }

    const stats = useMemo(() => {
        return users.reduce(
            (acc, user) => {
                acc.total += 1;

                if (user.isActive) {
                    acc.active += 1;
                } else {
                    acc.inactive += 1;
                }

                if (user.mustChangePassword) {
                    acc.mustChangePassword += 1;
                }

                acc.byRole[user.role] += 1;

                return acc;
            },
            {
                total: 0,
                active: 0,
                inactive: 0,
                mustChangePassword: 0,
                byRole: {
                    TEACHER: 0,
                    PEDAGOGIA: 0,
                    PSICOLOGIA: 0,
                } satisfies Record<OperationalRole, number>,
            },
        );
    }, [users]);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Usuarios operativos</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                            Gestión de cuentas operativas
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">
                            Desde aquí Dirección crea cuentas para Docentes, Pedagogía y
                            Psicología. El rol Tutor no se crea manualmente: se asigna cuando un
                            docente queda responsable de un grupo. Pequeño detalle que evita
                            duplicar personas como si fueran Pokémon administrativos.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <span className="ap-badge ap-badge-neutral">
                            Total: {stats.total}
                        </span>

                        <span className="ap-badge ap-badge-brand">
                            Activos: {stats.active}
                        </span>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                        <p className="text-xs text-sky-700">Docentes</p>
                        <p className="mt-1 text-xl font-semibold text-sky-900">
                            {stats.byRole.TEACHER}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs text-emerald-700">Pedagogía</p>
                        <p className="mt-1 text-xl font-semibold text-emerald-900">
                            {stats.byRole.PEDAGOGIA}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-xs text-violet-700">Psicología</p>
                        <p className="mt-1 text-xl font-semibold text-violet-900">
                            {stats.byRole.PSICOLOGIA}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs text-amber-700">Cambio pendiente</p>
                        <p className="mt-1 text-xl font-semibold text-amber-900">
                            {stats.mustChangePassword}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Crear usuario operativo
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Usa esta alta para cuentas que operan módulos del sistema. Para tutorías,
                        primero crea el docente y después asígnalo como tutor desde Asignaciones.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="ap-field">
                            <label className="ap-label">Nombre</label>
                            <input
                                className="ap-input"
                                value={form.firstName}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        firstName: event.target.value,
                                    }))
                                }
                                placeholder="María"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Apellido</label>
                            <input
                                className="ap-input"
                                value={form.lastName}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        lastName: event.target.value,
                                    }))
                                }
                                placeholder="López"
                                required
                            />
                        </div>

                        <div className="ap-field md:col-span-2">
                            <label className="ap-label">Correo</label>
                            <input
                                type="email"
                                className="ap-input"
                                value={form.email}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        email: event.target.value,
                                    }))
                                }
                                placeholder="usuario@aulapulse.local"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Contraseña temporal</label>
                            <input
                                type="password"
                                className="ap-input"
                                value={form.password}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        password: event.target.value,
                                    }))
                                }
                                placeholder="Mínimo 8 caracteres"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label className="ap-label">Rol base</label>
                            <select
                                className="ap-select"
                                value={form.role}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        role: event.target.value as OperationalRole,
                                    }))
                                }
                            >
                                <option value="TEACHER">Docente</option>
                                <option value="PEDAGOGIA">Pedagogía</option>
                                <option value="PSICOLOGIA">Psicología</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-white/70 p-4 text-sm text-[var(--color-text-soft)]">
                            <p className="font-semibold text-[var(--color-text)]">
                                {roleLabels[form.role]}
                            </p>
                            <p className="mt-2 leading-6">
                                {roleDescriptions[form.role]}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="ap-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={form.mustChangePassword}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            mustChangePassword: event.target.checked,
                                        }))
                                    }
                                />
                                Forzar cambio de contraseña al primer acceso
                            </label>
                        </div>

                        <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                            El rol Tutor se asigna automáticamente desde grupos. No lo busques
                            aquí, porque no está perdido: está diseñado así, milagrosamente.
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
                                disabled={saving}
                                className="ap-button-primary"
                            >
                                {saving ? "Guardando..." : "Crear usuario"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="ap-panel p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="ap-eyebrow">Listado</p>

                            <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                                Cuentas registradas
                            </h3>

                            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                Revisa usuarios operativos, estado de cuenta y rol base.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadUsers()}
                            className="ap-button-secondary"
                        >
                            Recargar
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-[var(--color-text-soft)]">
                            Cargando usuarios...
                        </p>
                    ) : users.length === 0 ? (
                        <EmptyState
                            title="Aún no hay usuarios operativos"
                            description="Crea docentes o cuentas de apoyo para comenzar a operar los módulos académicos."
                        />
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <article
                                    key={user.id}
                                    className="rounded-3xl border border-[var(--color-border)] bg-white/75 p-4"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-semibold text-[var(--color-text)]">
                                                    {getFullName(user)}
                                                </h4>

                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClassName(
                                                        user.role,
                                                    )}`}
                                                >
                                                    {roleLabels[user.role]}
                                                </span>
                                            </div>

                                            <p className="mt-2 break-all text-sm text-[var(--color-text-soft)]">
                                                {user.email}
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                                                {roleDescriptions[user.role]}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                                            <span
                                                className={
                                                    user.isActive
                                                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                                                        : "inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700"
                                                }
                                            >
                                                {user.isActive ? "Activo" : "Inactivo"}
                                            </span>

                                            <span
                                                className={
                                                    user.mustChangePassword
                                                        ? "inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                                                        : "inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700"
                                                }
                                            >
                                                {user.mustChangePassword
                                                    ? "Cambio pendiente"
                                                    : "Contraseña actualizada"}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}