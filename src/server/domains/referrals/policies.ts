import { REFERRAL_TARGET_AREA, type ReferralTargetArea } from "@/shared/enums/referral-target-area";
import { ROLE, type RoleCode } from "@/shared/enums/roles";


export type ReferralCaseAccessContext = {
    createdByUserId: number;
    tutorUserId: number | null;
    targetArea: ReferralTargetArea;
    relatedTeacherUserId: number | null;
};

function hasRole(roles: readonly RoleCode[], role: RoleCode) {
    return roles.includes(role);
}

function hasSupportAreaAccess(
    actorRoles: readonly RoleCode[],
    targetArea: ReferralTargetArea,
): boolean {
    if (
        targetArea === REFERRAL_TARGET_AREA.PEDAGOGY &&
        hasRole(actorRoles, ROLE.PEDAGOGIA)
    ) {
        return true;
    }

    if (
        targetArea === REFERRAL_TARGET_AREA.PSYCHOLOGY &&
        hasRole(actorRoles, ROLE.PSICOLOGIA)
    ) {
        return true;
    }

    return false;
}

export function canViewReferralCase(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    context: ReferralCaseAccessContext,
): boolean {
    if (hasRole(actorRoles, ROLE.DIRECTOR)) {
        return true;
    }

    if (hasRole(actorRoles, ROLE.TUTOR)) {
        return context.createdByUserId === actorUserId || context.tutorUserId === actorUserId;
    }

    if (hasSupportAreaAccess(actorRoles, context.targetArea)) {
        return true;
    }

    if (hasRole(actorRoles, ROLE.TEACHER)) {
        return context.relatedTeacherUserId === actorUserId;
    }

    return false;
}

export function canAddReferralNote(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    context: ReferralCaseAccessContext,
): boolean {
    if (hasRole(actorRoles, ROLE.DIRECTOR)) {
        return true;
    }

    if (hasRole(actorRoles, ROLE.TUTOR)) {
        return context.createdByUserId === actorUserId || context.tutorUserId === actorUserId;
    }

    if (hasSupportAreaAccess(actorRoles, context.targetArea)) {
        return true;
    }

    return false;
}

export function canCloseReferralCase(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    context: ReferralCaseAccessContext,
): boolean {
    if (hasRole(actorRoles, ROLE.DIRECTOR)) {
        return true;
    }

    if (hasRole(actorRoles, ROLE.TUTOR)) {
        return context.createdByUserId === actorUserId || context.tutorUserId === actorUserId;
    }

    if (hasSupportAreaAccess(actorRoles, context.targetArea)) {
        return true;
    }

    return false;
}

export function canReopenReferralCase(
    actorUserId: number,
    actorRoles: readonly RoleCode[],
    context: ReferralCaseAccessContext,
): boolean {
    if (hasRole(actorRoles, ROLE.DIRECTOR)) {
        return true;
    }

    if (hasRole(actorRoles, ROLE.TUTOR)) {
        return context.createdByUserId === actorUserId || context.tutorUserId === actorUserId;
    }

    if (hasSupportAreaAccess(actorRoles, context.targetArea)) {
        return true;
    }

    return false;
}

export function canChangeReferralTarget(
    _actorUserId: number,
    actorRoles: readonly RoleCode[],
    _context: ReferralCaseAccessContext,
): boolean {
    return hasRole(actorRoles, ROLE.DIRECTOR);
}