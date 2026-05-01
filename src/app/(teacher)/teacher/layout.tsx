import { RoleShell, type RoleShellNavItem } from "@/components/layout/role-shell";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


type TeacherLayoutProps = {
    children: React.ReactNode;
};

const navigationItems: RoleShellNavItem[] = [
    { href: "/teacher/dashboard", label: "Dashboard" },
    { href: "/teacher/courses", label: "Cursos" },
];

export default async function TeacherLayout({ children }: TeacherLayoutProps) {
    const session = await requireRolePageAccess(ROLE.TEACHER);

    return (
        <RoleShell
            session={session}
            title="Docente"
            sidebarDescription="Seguimiento de cursos asignados, asistencia, calificaciones e incidencias."
            headerTitle="Operación docente"
            headerDescription="Captura académica y seguimiento directo sobre cursos asignados."
            navigationItems={navigationItems}
        >
            {children}
        </RoleShell>
    );
}