import { getSuperManagedUser, SuperServiceError } from "@/server/domains/super/service";
import { notFound } from "next/navigation";
import Link from "next/link";


type PageProps = {
    params: Promise<{
        userId: string;
    }>;
    searchParams?: Promise<{
        error?: string;
    }>;
};

const roleLabels = {
    DIRECTOR: "Director",
    PEDAGOGIA: "Pedagogía",
    PSICOLOGIA: "Psicología",
} as const;

export default async function SuperUserDetailPage({
    params,
    searchParams,
}: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const userId = Number(resolvedParams.userId);
    const errorMessage = resolvedSearchParams.error;

    if (!Number.isInteger(userId) || userId <= 0) {
        notFound();
    }

    try {
        const user = await getSuperManagedUser(userId);

        return (
            <div className="space-y-8">
                {errorMessage ? (
                    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">
                        {errorMessage}
                    </section>
                ) : null}

                <section className="ap-panel p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="ap-eyebrow">Detalle de usuario</p>
                            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                                {user.fullName}
                            </h2>
                            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                {user.email}
                            </p>
                        </div>

                        <Link
                            href="/super/users"
                            className="ap-button-secondary"
                        >
                            Volver a usuarios
                        </Link>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 text-xs">
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
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="ap-panel p-6">
                        <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            Datos generales
                        </h3>

                        <dl className="mt-6 space-y-4 text-sm">
                            <div className="ap-panel-muted p-4">
                                <dt className="text-[var(--color-text-soft)]">Nombre</dt>
                                <dd className="mt-1 font-medium text-[var(--color-text)]">
                                    {user.firstName}
                                </dd>
                            </div>

                            <div className="ap-panel-muted p-4">
                                <dt className="text-[var(--color-text-soft)]">Primer apellido</dt>
                                <dd className="mt-1 font-medium text-[var(--color-text)]">
                                    {user.lastName}
                                </dd>
                            </div>

                            <div className="ap-panel-muted p-4">
                                <dt className="text-[var(--color-text-soft)]">Rol</dt>
                                <dd className="mt-1 font-medium text-[var(--color-text)]">
                                    {roleLabels[user.role]}
                                </dd>
                            </div>

                            <div className="ap-panel-muted p-4">
                                <dt className="text-[var(--color-text-soft)]">Fecha de creación</dt>
                                <dd className="mt-1 font-medium text-[var(--color-text)]">
                                    {user.createdAt}
                                </dd>
                            </div>

                            <div className="ap-panel-muted p-4">
                                <dt className="text-[var(--color-text-soft)]">Última actualización</dt>
                                <dd className="mt-1 font-medium text-[var(--color-text)]">
                                    {user.updatedAt}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="space-y-6">
                        <section className="ap-panel p-6">
                            <h3 className="text-xl font-semibold text-[var(--color-text)]">
                                Estado de la cuenta
                            </h3>
                            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                Puedes activar o desactivar la cuenta según corresponda.
                            </p>

                            <form
                                action={`/api/super/users/${user.id}`}
                                method="post"
                                className="mt-6"
                            >
                                <input type="hidden" name="_method" value="PATCH" />
                                <input
                                    type="hidden"
                                    name="isActive"
                                    value={user.isActive ? "false" : "true"}
                                />

                                <button
                                    type="submit"
                                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${user.isActive
                                        ? "bg-rose-600 text-white hover:bg-rose-700"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                        }`}
                                >
                                    {user.isActive ? "Desactivar cuenta" : "Activar cuenta"}
                                </button>
                            </form>

                            {user.role === "DIRECTOR" && !user.isActive ? (
                                <p className="mt-4 text-xs leading-5 text-[var(--color-text-soft)]">
                                    Este Director solo podrá activarse si no existe otro Director
                                    activo en el sistema.
                                </p>
                            ) : null}
                        </section>

                        <section className="ap-panel p-6">
                            <h3 className="text-xl font-semibold text-[var(--color-text)]">
                                Reset de contraseña
                            </h3>
                            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                                Al resetear, el usuario quedará obligado a cambiar contraseña en su
                                siguiente acceso.
                            </p>

                            <form
                                action={`/api/super/users/${user.id}`}
                                method="post"
                                className="mt-6 space-y-4"
                            >
                                <input type="hidden" name="_method" value="PATCH" />

                                <div className="ap-field">
                                    <label
                                        htmlFor="newPassword"
                                        className="ap-label"
                                    >
                                        Nueva contraseña temporal
                                    </label>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        minLength={8}
                                        required
                                        className="ap-input"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="ap-button-primary"
                                >
                                    Resetear contraseña
                                </button>
                            </form>
                        </section>
                    </div>
                </section>
            </div>
        );
    } catch (error) {
        if (error instanceof SuperServiceError && error.status === 404) {
            notFound();
        }

        throw error;
    }
}