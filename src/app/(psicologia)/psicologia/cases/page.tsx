import { SupportAreaCaseList } from "@/components/support-area/support-area-case-list";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { listSupportAreaCases } from "@/server/domains/support/service";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";


const area = getSupportAreaConfig("psicologia");

export default async function PsicologiaCasesPage() {
    const session = await requireRolePageAccess(ROLE.PSICOLOGIA, {
        loginPath: "/login?next=/psicologia/cases",
        forbiddenPath: "/login?next=/psicologia/cases",
    });

    const cases = listSupportAreaCases({
        userId: session.userId,
        role: ROLE.PSICOLOGIA,
        targetArea: area.targetArea,
    });

    return <SupportAreaCaseList area={area} cases={cases} />;
}