import { getUnreadNotificationsCountForUser } from "@/server/domains/notifications/service";
import { RoleShell, type RoleShellNavItem } from "@/components/layout/role-shell";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


type DirectorLayoutProps = {
    children: React.ReactNode;
};

const navigationItems: RoleShellNavItem[] = [
    { href: "/director/dashboard", label: "Dashboard" },
    { href: "/director/users", label: "Usuarios" },
    { href: "/director/academic/cycles", label: "Ciclos" },
    { href: "/director/academic/groups", label: "Grupos" },
    { href: "/director/academic/subjects", label: "Materias" },
    { href: "/director/students", label: "Alumnos" },
    { href: "/director/academic/courses", label: "Cursos" },
    { href: "/director/assignments", label: "Asignaciones" },
    { href: "/director/referrals", label: "Canalizaciones" },
    { href: "/director/notifications", label: "Notificaciones" },
];

export default async function DirectorLayout({ children }: DirectorLayoutProps) {
    const session = await requireRolePageAccess(ROLE.DIRECTOR);
    const unread = getUnreadNotificationsCountForUser(session.userId);

    return (
        <RoleShell
            session={session}
            title="Director"
            sidebarDescription="Gestión académica, usuarios operativos y estructura base del sistema."
            headerTitle="Gestión académica y operativa"
            headerDescription="Administra usuarios, ciclos, grupos, materias, alumnos y asignaciones."
            navigationItems={navigationItems}
            notificationPath="/director/notifications"
            unreadNotificationsCount={unread.count}
        >
            {children}
        </RoleShell>
    );
}