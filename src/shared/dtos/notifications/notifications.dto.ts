import type { NotificationType } from "@/shared/enums/notification-type";


export type NotificationContextType = "REFERRAL_CASE" | "INCIDENT";

export type NotificationDto = {
    id: number;
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    contextType: NotificationContextType | null;
    contextId: number | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
};

export type NotificationListDto = {
    items: NotificationDto[];
};

export type UnreadNotificationCountDto = {
    count: number;
};