import { getUnreadNotificationsCountForUser } from "@/server/domains/notifications/service";
import { RoleShell, type RoleShellNavItem } from "@/components/layout/role-shell";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


const navigationItems: RoleShellNavItem[] = [
    { href: "/tutor/dashboard", label: "Dashboard" },
    { href: "/tutor/groups", label: "Grupos" },
    { href: "/tutor/referrals", label: "Canalizaciones" },
    { href: "/tutor/referrals/new", label: "Nueva canalización" },
    { href: "/tutor/notifications", label: "Notificaciones" },
];

export default async function TutorLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const session = await requireRolePageAccess(ROLE.TUTOR);
    const unread = getUnreadNotificationsCountForUser(session.userId);

    return (
        <RoleShell
            session={session}
            title="Tutor"
            sidebarDescription="Seguimiento de grupos, riesgo académico y canalizaciones abiertas."
            headerTitle="Seguimiento tutorial"
            headerDescription="Supervisa grupos, casos y trazabilidad de acompañamiento."
            navigationItems={navigationItems}
            notificationPath="/tutor/notifications"
            unreadNotificationsCount={unread.count}
        >
            {children}
        </RoleShell>
    );
}