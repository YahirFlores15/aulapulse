import type { NotificationDto, UnreadNotificationCountDto, } from "@/shared/dtos/notifications/notifications.dto";
import { REFERRAL_TARGET_AREA, type ReferralTargetArea } from "@/shared/enums/referral-target-area";
import type { StudentTrafficLightCauseDto } from "@/shared/dtos/risk/student-traffic-light.dto";
import { NOTIFICATION_TYPE } from "@/shared/enums/notification-type";
import { ROLE, type RoleCode } from "@/shared/enums/roles";

import { countUnreadNotificationsByUser, createNotifications, getNotificationByIdForUser, getStudentRiskNotificationContext, listActiveUsersByRoles, listNotificationsByUser, listRiskRedRecipientsForStudent, markNotificationAsRead, } from "./repo";
import { sendReferralCreatedEmailSafely, sendStudentRiskRedEmailSafely, } from "./email.service";


export class NotificationServiceError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "NotificationServiceError";
        this.status = status;
    }
}

function buildRecipientLink(role: RoleCode, caseId: number) {
    if (role === ROLE.DIRECTOR) {
        return `/director/referrals/${caseId}`;
    }

    if (role === ROLE.PEDAGOGIA) {
        return `/pedagogia/cases/${caseId}`;
    }

    if (role === ROLE.PSICOLOGIA) {
        return `/psicologia/cases/${caseId}`;
    }

    return `/tutor/referrals/${caseId}`;
}

function buildStudentRiskLink(
    role: RoleCode,
    studentId: number,
    groupId: number | null,
) {
    if (role === ROLE.DIRECTOR) {
        return `/director/academic/groups?studentId=${studentId}`;
    }

    if (role === ROLE.TUTOR && groupId) {
        return `/tutor/groups/${groupId}?studentId=${studentId}`;
    }

    return "/tutor/groups";
}

function getSupportAreaRoleByTargetArea(targetArea: ReferralTargetArea): RoleCode {
    if (targetArea === REFERRAL_TARGET_AREA.PEDAGOGY) {
        return ROLE.PEDAGOGIA;
    }

    return ROLE.PSICOLOGIA;
}

function formatCauseForMessage(cause: StudentTrafficLightCauseDto) {
    const context = [
        cause.subjectCode,
        cause.subjectName,
    ].filter(Boolean).join(" · ");

    if (context) {
        return `${cause.message} (${context})`;
    }

    return cause.message;
}

export function notifyReferralCreated(input: {
    actorUserId: number;
    actorName: string;
    studentName: string;
    groupCode: string;
    reasonName: string;
    caseId: number;
    targetArea: ReferralTargetArea;
}) {
    const supportAreaRole = getSupportAreaRoleByTargetArea(input.targetArea);

    const recipients = listActiveUsersByRoles([
        ROLE.DIRECTOR,
        supportAreaRole,
    ]);

    const recipientMap = new Map<number, { userId: number; role: RoleCode }>();

    for (const recipient of recipients) {
        if (!recipientMap.has(recipient.user_id)) {
            recipientMap.set(recipient.user_id, {
                userId: recipient.user_id,
                role: recipient.role_code,
            });
        }
    }

    recipientMap.set(input.actorUserId, {
        userId: input.actorUserId,
        role: ROLE.TUTOR,
    });

    const title = "Nueva canalización registrada";
    const message = `${input.actorName} registró una canalización para ${input.studentName} del grupo ${input.groupCode} por motivo: ${input.reasonName}.`;

    createNotifications(
        Array.from(recipientMap.values()).map((recipient) => ({
            userId: recipient.userId,
            type: NOTIFICATION_TYPE.REFERRAL_CREATED,
            title,
            message,
            link: buildRecipientLink(recipient.role, input.caseId),
            contextType: "REFERRAL_CASE" as const,
            contextId: input.caseId,
        })),
    );

    void sendReferralCreatedEmailSafely({
        actorUserId: input.actorUserId,
        actorName: input.actorName,
        studentName: input.studentName,
        groupCode: input.groupCode,
        reasonName: input.reasonName,
        targetArea: input.targetArea,
        summary: message,
        caseId: input.caseId,
    });
}

export function notifyStudentRiskTurnedRed(input: {
    studentId: number;
    redCausesCount: number;
    yellowCausesCount: number;
    causes: StudentTrafficLightCauseDto[];
}) {
    const context = getStudentRiskNotificationContext(input.studentId);

    if (!context) {
        return;
    }

    const recipients = listRiskRedRecipientsForStudent(input.studentId);

    if (recipients.length === 0) {
        return;
    }

    const groupLabel = context.groupCode
        ? ` del grupo ${context.groupCode}`
        : "";

    const title = "Alumno en semáforo rojo";
    const mainCause = input.causes.find((cause) => cause.severity === "RED");
    const causeMessage = mainCause
        ? ` Causa principal: ${formatCauseForMessage(mainCause)}.`
        : "";

    const message = `${context.studentName}${groupLabel} cambió a semáforo rojo.${causeMessage}`;

    createNotifications(
        recipients.map((recipient) => ({
            userId: recipient.userId,
            type: NOTIFICATION_TYPE.STUDENT_RISK_TURNED_RED,
            title,
            message,
            link: buildStudentRiskLink(
                recipient.roleCode,
                context.studentId,
                context.groupId,
            ),
            contextType: null,
            contextId: context.studentId,
        })),
    );

    void sendStudentRiskRedEmailSafely({
        recipientUserIds: recipients.map((recipient) => recipient.userId),
        studentName: context.studentName,
        controlNumber: context.controlNumber,
        groupCode: context.groupCode,
        groupName: context.groupName,
        redCausesCount: input.redCausesCount,
        yellowCausesCount: input.yellowCausesCount,
        topCauses: input.causes
            .filter((cause) => cause.severity === "RED")
            .slice(0, 5)
            .map(formatCauseForMessage),
    });
}

export function getNotificationsForUser(
    userId: number,
    options?: {
        limit?: number;
        unreadOnly?: boolean;
    },
): NotificationDto[] {
    return listNotificationsByUser(userId, options);
}

export function getUnreadNotificationsCountForUser(
    userId: number,
): UnreadNotificationCountDto {
    return {
        count: countUnreadNotificationsByUser(userId),
    };
}

export function readNotificationForUser(
    notificationId: number,
    userId: number,
): NotificationDto {
    const existing = getNotificationByIdForUser(notificationId, userId);

    if (!existing) {
        throw new NotificationServiceError("Notificación no encontrada.", 404);
    }

    markNotificationAsRead(notificationId, userId);

    const updated = getNotificationByIdForUser(notificationId, userId);

    if (!updated) {
        throw new NotificationServiceError(
            "No se pudo recuperar la notificación actualizada.",
            500,
        );
    }

    return updated;
}