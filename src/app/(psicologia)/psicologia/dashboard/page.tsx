import { SupportAreaDashboard } from "@/components/support-area/support-area-dashboard";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { listSupportAreaCases } from "@/server/domains/support/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


const area = getSupportAreaConfig("psicologia");

export default async function PsicologiaDashboardPage() {
    const session = await requireRolePageAccess(ROLE.PSICOLOGIA, {
        loginPath: "/login?next=/psicologia/dashboard",
        forbiddenPath: "/login?next=/psicologia/dashboard",
    });

    const cases = listSupportAreaCases({
        userId: session.userId,
        role: ROLE.PSICOLOGIA,
        targetArea: area.targetArea,
    });

    return <SupportAreaDashboard area={area} cases={cases} />;
}