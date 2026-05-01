import type { IncidentListItemDto, IncidentNotificationStatusDto, } from "@/shared/dtos/incidents/incidents.dto";
import { sendIncidentEmailSafely } from "@/server/domains/notifications/email.service";
import { createNotifications } from "@/server/domains/notifications/repo";
import { NOTIFICATION_TYPE } from "@/shared/enums/notification-type";

import { listDirectorRecipientUserIds, listTeacherRecipientUserIdsByCourse, listTutorRecipientUserIdsByGroup, } from "./repo";


type IncidentNotificationEvent =
    | "CREATED"
    | "CLOSED"
    | "REOPENED"
    | "NOTE_ADDED";

function getIncidentLinkForRecipient(
    role: "DIRECTOR" | "TUTOR" | "TEACHER",
    incidentId: number,
) {
    if (role === "DIRECTOR") {
        return `/director/incidents/${incidentId}`;
    }

    if (role === "TUTOR") {
        return `/tutor/incidents/${incidentId}`;
    }

    return `/teacher/courses`;
}

function getNotificationCopy(event: IncidentNotificationEvent, incident: IncidentListItemDto) {
    if (event === "CREATED") {
        return {
            type: NOTIFICATION_TYPE.INCIDENT_CREATED,
            title: "Nueva incidencia registrada",
            message: `${incident.createdByName} registró una incidencia para ${incident.studentFullName}: ${incident.typeName}.`,
            emailLabel: "Nueva incidencia registrada",
        };
    }

    if (event === "CLOSED") {
        return {
            type: NOTIFICATION_TYPE.INCIDENT_CLOSED,
            title: "Incidencia cerrada",
            message: `Se cerró la incidencia de ${incident.studentFullName}: ${incident.typeName}.`,
            emailLabel: "Incidencia cerrada",
        };
    }

    if (event === "REOPENED") {
        return {
            type: NOTIFICATION_TYPE.INCIDENT_REOPENED,
            title: "Incidencia reabierta",
            message: `Se reabrió la incidencia de ${incident.studentFullName}: ${incident.typeName}.`,
            emailLabel: "Incidencia reabierta",
        };
    }

    return {
        type: NOTIFICATION_TYPE.INCIDENT_NOTE_ADDED,
        title: "Nueva nota en incidencia",
        message: `Se agregó seguimiento a la incidencia de ${incident.studentFullName}: ${incident.typeName}.`,
        emailLabel: "Nueva nota en incidencia",
    };
}

function buildRecipientUserIds(input: {
    actorUserId: number;
    incident: IncidentListItemDto;
}) {
    const recipientMap = new Map<number, { userId: number; role: "DIRECTOR" | "TUTOR" | "TEACHER" }>();

    for (const userId of listDirectorRecipientUserIds()) {
        recipientMap.set(userId, {
            userId,
            role: "DIRECTOR",
        });
    }

    for (const userId of listTutorRecipientUserIdsByGroup(input.incident.groupId)) {
        recipientMap.set(userId, {
            userId,
            role: "TUTOR",
        });
    }

    for (const userId of listTeacherRecipientUserIdsByCourse(input.incident.courseId)) {
        recipientMap.set(userId, {
            userId,
            role: "TEACHER",
        });
    }

    recipientMap.delete(input.actorUserId);

    return Array.from(recipientMap.values());
}

export async function notifyIncidentEvent(input: {
    actorUserId: number;
    actorName: string;
    event: IncidentNotificationEvent;
    incident: IncidentListItemDto;
    noteForEmail?: string | null;
}): Promise<IncidentNotificationStatusDto> {
    const copy = getNotificationCopy(input.event, input.incident);
    const recipients = buildRecipientUserIds({
        actorUserId: input.actorUserId,
        incident: input.incident,
    });

    const internalNotificationsCreated = createNotifications(
        recipients.map((recipient) => ({
            userId: recipient.userId,
            type: copy.type,
            title: copy.title,
            message: copy.message,
            link: getIncidentLinkForRecipient(recipient.role, input.incident.id),
            contextType: "INCIDENT" as const,
            contextId: input.incident.id,
        })),
    );

    const emailResult = await sendIncidentEmailSafely({
        recipientUserIds: recipients.map((recipient) => recipient.userId),
        actorName: input.actorName,
        studentName: input.incident.studentFullName,
        groupCode: input.incident.groupCode,
        subjectName: input.incident.subjectName,
        typeName: input.incident.typeName,
        note: input.noteForEmail ?? input.incident.note,
        incidentId: input.incident.id,
        eventLabel: copy.emailLabel,
    });

    return {
        internalNotificationsCreated,
        emailAttempted: emailResult.attempted,
        emailSent: emailResult.sent,
        emailError: emailResult.error,
    };
}