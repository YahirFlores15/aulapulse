import { RoleShell, type RoleShellNavItem } from "@/components/layout/role-shell";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import type { ReactNode } from "react";


const navigationItems: RoleShellNavItem[] = [
    { href: "/super/dashboard", label: "Dashboard" },
    { href: "/super/users", label: "Usuarios" },
];

export default async function SuperLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await requireRolePageAccess(ROLE.SUPERUSER, {
        loginPath: "/login?next=/super/dashboard",
    });

    return (
        <RoleShell
            session={session}
            title="Superusuario"
            sidebarDescription="Administración mínima de cuentas estratégicas del sistema."
            headerTitle="Panel institucional"
            headerDescription="Gestiona Director, Pedagogía y Psicología con alcance controlado."
            navigationItems={navigationItems}
        >
            {children}
        </RoleShell>
    );
}