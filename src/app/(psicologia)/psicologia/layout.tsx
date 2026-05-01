import { getUnreadNotificationsCountForUser } from "@/server/domains/notifications/service";
import { RoleShell, type RoleShellNavItem } from "@/components/layout/role-shell";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


const area = getSupportAreaConfig("psicologia");

const navigationItems: RoleShellNavItem[] = [
    { href: area.dashboardPath, label: "Dashboard" },
    { href: area.casesPath, label: "Casos" },
    { href: area.notificationsPath, label: "Notificaciones" },
];

export default async function PsicologiaLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await requireRolePageAccess(ROLE.PSICOLOGIA, {
        loginPath: "/login?next=/psicologia/dashboard",
    });

    const unread = getUnreadNotificationsCountForUser(session.userId);

    return (
        <RoleShell
            session={session}
            title={area.title}
            sidebarDescription="Seguimiento de canalizaciones asignadas específicamente a Psicología."
            headerTitle={`Área de apoyo: ${area.title}`}
            headerDescription="Atiende casos psicológicos con expediente y trazabilidad separados."
            navigationItems={navigationItems}
            notificationPath={area.notificationsPath}
            unreadNotificationsCount={unread.count}
        >
            {children}
        </RoleShell>
    );
}