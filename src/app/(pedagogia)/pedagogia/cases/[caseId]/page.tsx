import { getSupportAreaCaseDetail, SupportServiceError } from "@/server/domains/support/service";
import { SupportAreaCaseDetail } from "@/components/support-area/support-area-case-detail";
import { getSupportAreaConfig } from "@/shared/lib/support-area-routing";
import { requireRolePageAccess } from "@/server/auth/page-access";
import { ROLE } from "@/shared/enums/roles";
import { notFound } from "next/navigation";


type PageProps = {
    params: Promise<{
        caseId: string;
    }>;
};

const area = getSupportAreaConfig("pedagogia");

export default async function PedagogiaCaseDetailPage({ params }: PageProps) {
    const session = await requireRolePageAccess(ROLE.PEDAGOGIA, {
        loginPath: "/login?next=/pedagogia/cases",
        forbiddenPath: "/login?next=/pedagogia/cases",
    });

    const resolvedParams = await params;
    const caseId = Number(resolvedParams.caseId);

    if (!Number.isInteger(caseId) || caseId <= 0) {
        notFound();
    }

    try {
        const detail = getSupportAreaCaseDetail({
            userId: session.userId,
            role: ROLE.PEDAGOGIA,
            targetArea: area.targetArea,
            caseId,
        });

        return <SupportAreaCaseDetail area={area} detail={detail} />;
    } catch (error) {
        if (
            error instanceof SupportServiceError &&
            (error.status === 403 || error.status === 404)
        ) {
            notFound();
        }

        throw error;
    }
}