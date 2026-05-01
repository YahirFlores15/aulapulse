import { SupportAreaCaseList } from "@/components/support-area/support-area-case-list";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { listSupportAreaCases } from "@/server/domains/support/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


const area = getSupportAreaConfig("pedagogia");

export default async function PedagogiaCasesPage() {
    const session = await requireRolePageAccess(ROLE.PEDAGOGIA, {
        loginPath: "/login?next=/pedagogia/cases",
        forbiddenPath: "/login?next=/pedagogia/cases",
    });

    const cases = listSupportAreaCases({
        userId: session.userId,
        role: ROLE.PEDAGOGIA,
        targetArea: area.targetArea,
    });

    return <SupportAreaCaseList area={area} cases={cases} />;
}