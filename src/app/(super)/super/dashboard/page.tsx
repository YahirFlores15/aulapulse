import { listSuperManagedUsers } from "@/server/domains/super/service";
import Link from "next/link";


function countBy<T>(items: T[], predicate: (item: T) => boolean) {
    return items.filter(predicate).length;
}

export default async function SuperDashboardPage() {
    const users = await listSuperManagedUsers();

    const totalUsers = users.length;
    const activeUsers = countBy(users, (user) => user.isActive);
    const inactiveUsers = countBy(users, (user) => !user.isActive);
    const directors = countBy(users, (user) => user.role === "DIRECTOR");
    const pedagogiaUsers = countBy(users, (user) => user.role === "PEDAGOGIA");
    const psicologiaUsers = countBy(users, (user) => user.role === "PSICOLOGIA");

    const recentUsers = [...users]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Superusuario</p>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Dashboard
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                    Administración mínima de cuentas clave. Desde aquí se gestionan Director,
                    Pedagogía y Psicología. El soporte genérico queda fuera del flujo nuevo,
                    porque aparentemente nombrar bien las áreas también cuenta como civilización.
                </p>

                <div className="mt-6">
                    <Link href="/super/users" className="ap-button-primary">
                        Gestionar usuarios
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Usuarios administrables</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {totalUsers}
                    </p>
                </article>

                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Activos</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {activeUsers}
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        Inactivos: {inactiveUsers}
                    </p>
                </article>

                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Directores</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {directors}
                    </p>
                </article>

                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Pedagogía</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {pedagogiaUsers}
                    </p>
                </article>

                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Psicología</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {psicologiaUsers}
                    </p>
                </article>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Cuentas recientes
                        </h2>
                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            Últimas cuentas administrables creadas.
                        </p>
                    </div>

                    <Link href="/super/users" className="ap-button-secondary">
                        Ver todos
                    </Link>
                </div>

                {recentUsers.length === 0 ? (
                    <div className="ap-panel-muted p-6 text-sm text-[var(--color-text-soft)]">
                        No hay usuarios administrables todavía.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentUsers.map((user) => (
                            <Link
                                key={user.id}
                                href={`/super/users/${user.id}`}
                                className="ap-panel-muted block p-4 transition hover:border-[var(--color-brand-300)]"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-[var(--color-text)]">
                                            {user.fullName}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                            {user.email}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="ap-badge ap-badge-brand">
                                            {user.role === "DIRECTOR"
                                                ? "Director"
                                                : user.role === "PEDAGOGIA"
                                                    ? "Pedagogía"
                                                    : "Psicología"}
                                        </span>

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive
                                                ? "bg-emerald-100 text-emerald-800"
                                                : "bg-rose-100 text-rose-800"
                                                }`}
                                        >
                                            {user.isActive ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}