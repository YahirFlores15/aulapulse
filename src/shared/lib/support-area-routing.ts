import { REFERRAL_TARGET_AREA, type ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { ROLE, type RoleCode } from "@/shared/enums/roles";


export type SupportAreaSlug = "pedagogia" | "psicologia";

export type SupportAreaConfig = {
    slug: SupportAreaSlug;
    role: RoleCode;
    targetArea: ReferralTargetArea;
    title: string;
    shortTitle: string;
    dashboardPath: string;
    casesPath: string;
    notificationsPath: string;
    apiBasePath: string;
};

export const SUPPORT_AREA_CONFIGS: Record<SupportAreaSlug, SupportAreaConfig> = {
    pedagogia: {
        slug: "pedagogia",
        role: ROLE.PEDAGOGIA,
        targetArea: REFERRAL_TARGET_AREA.PEDAGOGY,
        title: "Pedagogía",
        shortTitle: "Pedagogía",
        dashboardPath: "/pedagogia/dashboard",
        casesPath: "/pedagogia/cases",
        notificationsPath: "/pedagogia/notifications",
        apiBasePath: "/api/pedagogia",
    },
    psicologia: {
        slug: "psicologia",
        role: ROLE.PSICOLOGIA,
        targetArea: REFERRAL_TARGET_AREA.PSYCHOLOGY,
        title: "Psicología",
        shortTitle: "Psicología",
        dashboardPath: "/psicologia/dashboard",
        casesPath: "/psicologia/cases",
        notificationsPath: "/psicologia/notifications",
        apiBasePath: "/api/psicologia",
    },
};

export function getSupportAreaConfig(slug: SupportAreaSlug): SupportAreaConfig {
    return SUPPORT_AREA_CONFIGS[slug];
}

export function getSupportAreaRoleByTargetArea(targetArea: ReferralTargetArea): RoleCode {
    if (targetArea === REFERRAL_TARGET_AREA.PEDAGOGY) {
        return ROLE.PEDAGOGIA;
    }

    return ROLE.PSICOLOGIA;
}

export function getSupportAreaConfigByRole(role: RoleCode): SupportAreaConfig | null {
    if (role === ROLE.PEDAGOGIA) {
        return SUPPORT_AREA_CONFIGS.pedagogia;
    }

    if (role === ROLE.PSICOLOGIA) {
        return SUPPORT_AREA_CONFIGS.psicologia;
    }

    return null;
}

export function getSupportAreaConfigByTargetArea(
    targetArea: ReferralTargetArea,
): SupportAreaConfig {
    return targetArea === REFERRAL_TARGET_AREA.PEDAGOGY
        ? SUPPORT_AREA_CONFIGS.pedagogia
        : SUPPORT_AREA_CONFIGS.psicologia;
}