import { listSuperManagedUsers } from "@/server/domains/super/service";
import Link from "next/link";


const roleLabels = {
    DIRECTOR: "Director",
    PEDAGOGIA: "Pedagogía",
    PSICOLOGIA: "Psicología",
} as const;

type SuperUsersPageProps = {
    searchParams?: Promise<{
        error?: string;
        success?: string;
    }>;
};

export default async function SuperUsersPage(props: SuperUsersPageProps) {
    const users = await listSuperManagedUsers();
    const searchParams = props.searchParams ? await props.searchParams : {};
    const error = searchParams.error ?? "";
    const success = searchParams.success ?? "";

    const hasActiveDirector = users.some(
        (user) => user.role === "DIRECTOR" && user.isActive,
    );

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Usuarios administrables</p>
                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Director y áreas de apoyo
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                    Aquí puedes crear y revisar cuentas de Director, Pedagogía y Psicología.
                    El sistema permite mantener historial de Directores inactivos, pero solo
                    puede existir un Director activo operando en el sistema.
                </p>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="ap-panel p-6">
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        Crear nueva cuenta
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                        La cuenta se crea activa y con cambio obligatorio de contraseña.
                    </p>

                    {hasActiveDirector ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                            Ya existe una cuenta activa con rol Director. Puedes seguir creando
                            cuentas de Pedagogía o Psicología, pero para crear otro Director
                            primero debes desactivar al Director activo actual.
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900">
                            No hay Director activo actualmente. Puedes crear una nueva cuenta
                            de Director.
                        </div>
                    )}

                    {error ? (
                        <div className="mt-4 ap-message ap-message-error">
                            {error}
                        </div>
                    ) : null}

                    {success ? (
                        <div className="mt-4 ap-message ap-message-success">
                            {success}
                        </div>
                    ) : null}

                    <form
                        action="/api/super/users"
                        method="post"
                        className="mt-6 space-y-4"
                    >
                        <div className="ap-field">
                            <label
                                htmlFor="email"
                                className="ap-label"
                            >
                                Correo
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="ap-input"
                                placeholder="usuario@aulapulse.local"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="ap-field">
                                <label
                                    htmlFor="firstName"
                                    className="ap-label"
                                >
                                    Nombre
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    required
                                    className="ap-input"
                                    placeholder="Laura"
                                />
                            </div>

                            <div className="ap-field">
                                <label
                                    htmlFor="lastName"
                                    className="ap-label"
                                >
                                    Primer apellido
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    required
                                    className="ap-input"
                                    placeholder="Gómez"
                                />
                            </div>
                        </div>

                        <div className="ap-field">
                            <label
                                htmlFor="role"
                                className="ap-label"
                            >
                                Rol
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="ap-select"
                                defaultValue={hasActiveDirector ? "PEDAGOGIA" : "DIRECTOR"}
                            >
                                {!hasActiveDirector ? (
                                    <option value="DIRECTOR">Director</option>
                                ) : null}
                                <option value="PEDAGOGIA">Pedagogía</option>
                                <option value="PSICOLOGIA">Psicología</option>
                            </select>
                        </div>

                        <div className="ap-field">
                            <label
                                htmlFor="password"
                                className="ap-label"
                            >
                                Contraseña temporal
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                className="ap-input"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>

                        <button
                            type="submit"
                            className="ap-button-primary w-full"
                        >
                            Crear cuenta
                        </button>
                    </form>
                </div>

                <div className="ap-panel p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-semibold text-[var(--color-text)]">
                                Listado actual
                            </h3>
                            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                Solo cuentas bajo control del Superusuario.
                            </p>
                        </div>

                        <div className="ap-badge ap-badge-neutral">
                            Total: {users.length}
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {users.length === 0 ? (
                            <div className="ap-panel-muted p-5 text-sm text-[var(--color-text-soft)]">
                                No hay usuarios administrables todavía.
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="ap-panel-muted p-4"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <p className="font-medium text-[var(--color-text)]">
                                                {user.fullName}
                                            </p>
                                            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                                {user.email}
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                <span className="ap-badge ap-badge-brand">
                                                    {roleLabels[user.role]}
                                                </span>

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 font-semibold ${user.isActive
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-rose-100 text-rose-800"
                                                        }`}
                                                >
                                                    {user.isActive ? "Activo" : "Inactivo"}
                                                </span>

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 font-semibold ${user.mustChangePassword
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    {user.mustChangePassword
                                                        ? "Cambio de contraseña pendiente"
                                                        : "Sin pendiente"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/super/users/${user.id}`}
                                                className="ap-button-secondary"
                                            >
                                                Ver detalle
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}