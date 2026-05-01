import { getNotificationsForUser } from "@/server/domains/notifications/service";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import Link from "next/link";


const area = getSupportAreaConfig("pedagogia");

export default async function PedagogiaNotificationsPage() {
    const session = await requireRolePageAccess(ROLE.PEDAGOGIA, {
        loginPath: "/login?next=/pedagogia/notifications",
        forbiddenPath: "/login?next=/pedagogia/notifications",
    });

    const notifications = getNotificationsForUser(session.userId, {
        limit: 50,
    });

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">{area.title}</p>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Notificaciones
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                    Avisos internos relacionados con casos asignados a Pedagogía.
                </p>
            </section>

            <section className="ap-panel p-6">
                {notifications.length === 0 ? (
                    <div className="ap-panel-muted p-6 text-sm text-[var(--color-text-soft)]">
                        No tienes notificaciones por ahora.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <article key={notification.id} className="ap-panel-muted p-5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-semibold text-[var(--color-text)]">
                                                {notification.title}
                                            </p>
                                            {!notification.isRead ? (
                                                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                                    Nueva
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                    Leída
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm leading-6 text-[var(--color-text-soft)]">
                                            {notification.message}
                                        </p>

                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(notification.createdAt).toLocaleString("es-MX")}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {notification.link ? (
                                            <Link
                                                href={notification.link}
                                                className="ap-button-secondary"
                                            >
                                                Abrir
                                            </Link>
                                        ) : null}

                                        {!notification.isRead ? (
                                            <form
                                                action={`/api/notifications/${notification.id}/read`}
                                                method="POST"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="redirectTo"
                                                    value={area.notificationsPath}
                                                />
                                                <button
                                                    type="submit"
                                                    className="ap-button-primary"
                                                >
                                                    Marcar como leída
                                                </button>
                                            </form>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}