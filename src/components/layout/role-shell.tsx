import { ActiveRoleSwitcher } from "@/components/auth/active-role-switcher";
import type { ValidatedSession } from "@/server/auth/types";
import { getRoleLabel } from "@/shared/lib/auth-routing";
import { clearSession } from "@/server/auth/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";


export type RoleShellNavItem = {
    href: string;
    label: string;
};

type RoleShellProps = {
    children: ReactNode;
    session: ValidatedSession;
    title: string;
    eyebrow?: string;
    sidebarDescription: string;
    headerTitle: string;
    headerDescription: string;
    navigationItems: RoleShellNavItem[];
    notificationPath?: string;
    unreadNotificationsCount?: number;
};

async function logoutAction() {
    "use server";

    await clearSession();
    redirect("/login");
}

function NotificationBadge({ count }: { count: number }) {
    if (count <= 0) {
        return null;
    }

    return (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {count}
        </span>
    );
}

function SidebarNav({
    navigationItems,
    notificationPath,
    unreadNotificationsCount,
}: {
    navigationItems: RoleShellNavItem[];
    notificationPath?: string;
    unreadNotificationsCount: number;
}) {
    return (
        <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-[var(--color-text-soft)] transition hover:border-[var(--color-border)] hover:bg-white hover:text-[var(--color-text)]"
                >
                    <span>{item.label}</span>

                    {item.href === notificationPath ? (
                        <NotificationBadge count={unreadNotificationsCount} />
                    ) : null}
                </Link>
            ))}
        </nav>
    );
}

function MobileNav({
    navigationItems,
    notificationPath,
    unreadNotificationsCount,
}: {
    navigationItems: RoleShellNavItem[];
    notificationPath?: string;
    unreadNotificationsCount: number;
}) {
    return (
        <div className="border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] px-4 py-3 backdrop-blur xl:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
                {navigationItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-text-soft)] transition hover:border-[var(--color-brand-300)] hover:text-[var(--color-text)]"
                    >
                        <span>{item.label}</span>

                        {item.href === notificationPath ? (
                            <NotificationBadge count={unreadNotificationsCount} />
                        ) : null}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function SessionSummary({
    session,
}: {
    session: ValidatedSession;
}) {
    return (
        <div className="ap-panel-muted mt-auto p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
                Sesión activa
            </p>

            <p className="mt-3 truncate text-sm font-medium text-[var(--color-text)]">
                {session.email}
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Modo activo: {getRoleLabel(session.activeRole)}
            </p>

            {session.roles.length > 1 ? (
                <div className="mt-5">
                    <ActiveRoleSwitcher
                        roles={session.roles}
                        activeRole={session.activeRole}
                    />
                </div>
            ) : null}
        </div>
    );
}

function HeaderSessionActions({
    session,
    notificationPath,
    unreadNotificationsCount = 0,
}: {
    session: ValidatedSession;
    notificationPath?: string;
    unreadNotificationsCount?: number;
}) {
    return (
        <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-3">
                {notificationPath ? (
                    <Link
                        href={notificationPath}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-brand-300)]"
                    >
                        <span>Notificaciones</span>
                        <NotificationBadge count={unreadNotificationsCount} />
                    </Link>
                ) : null}

                <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 px-4 py-2 md:block xl:hidden">
                    <p className="max-w-[240px] truncate text-sm font-medium text-[var(--color-text)]">
                        {session.email}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        Modo: {getRoleLabel(session.activeRole)}
                    </p>
                </div>

                <form action={logoutAction}>
                    <button type="submit" className="ap-button-secondary">
                        Cerrar sesión
                    </button>
                </form>
            </div>

            {session.roles.length > 1 ? (
                <div className="xl:hidden">
                    <ActiveRoleSwitcher
                        roles={session.roles}
                        activeRole={session.activeRole}
                    />
                </div>
            ) : null}
        </div>
    );
}

export function RoleShell({
    children,
    session,
    title,
    eyebrow = "AulaPulse",
    sidebarDescription,
    headerTitle,
    headerDescription,
    navigationItems,
    notificationPath,
    unreadNotificationsCount = 0,
}: RoleShellProps) {
    return (
        <div className="min-h-screen bg-transparent text-[var(--color-text)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px]">
                <aside className="hidden w-80 shrink-0 border-r border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] px-6 py-6 backdrop-blur xl:flex xl:flex-col">
                    <div>
                        <p className="ap-eyebrow">{eyebrow}</p>

                        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
                            {title}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                            {sidebarDescription}
                        </p>
                    </div>

                    <SidebarNav
                        navigationItems={navigationItems}
                        notificationPath={notificationPath}
                        unreadNotificationsCount={unreadNotificationsCount}
                    />

                    <SessionSummary session={session} />
                </aside>

                <div className="flex min-h-screen flex-1 flex-col">
                    <header className="border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.74)] px-4 py-4 backdrop-blur md:px-8">
                        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-soft)]">
                                    {headerTitle}
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                    {headerDescription}
                                </p>
                            </div>

                            <HeaderSessionActions
                                session={session}
                                notificationPath={notificationPath}
                                unreadNotificationsCount={unreadNotificationsCount}
                            />
                        </div>
                    </header>

                    <MobileNav
                        navigationItems={navigationItems}
                        notificationPath={notificationPath}
                        unreadNotificationsCount={unreadNotificationsCount}
                    />

                    <main className="flex-1 px-4 py-5 md:px-8 md:py-8">
                        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}