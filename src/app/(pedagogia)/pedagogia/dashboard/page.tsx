import { SupportAreaDashboard } from "@/components/support-area/support-area-dashboard";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { listSupportAreaCases } from "@/server/domains/support/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


const area = getSupportAreaConfig("pedagogia");

export default async function PedagogiaDashboardPage() {
    const session = await requireRolePageAccess(ROLE.PEDAGOGIA, {
        loginPath: "/login?next=/pedagogia/dashboard",
        forbiddenPath: "/login?next=/pedagogia/dashboard",
    });

    const cases = listSupportAreaCases({
        userId: session.userId,
        role: ROLE.PEDAGOGIA,
        targetArea: area.targetArea,
    });

    return <SupportAreaDashboard area={area} cases={cases} />;
}