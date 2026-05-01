import type { NotificationContextType, NotificationDto, } from "@/shared/dtos/notifications/notifications.dto";
import type { NotificationType } from "@/shared/enums/notification-type";
import { execute, query, queryOne } from "@/server/db/queries";
import type { RoleCode } from "@/shared/enums/roles";
import { ROLE } from "@/shared/enums/roles";


type NotificationRow = {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    context_type: NotificationContextType | null;
    context_id: number | null;
    is_read: number;
    read_at: string | null;
    created_at: string;
};

type UserRoleRecipientRow = {
    user_id: number;
    role_code: RoleCode;
};

type StudentRiskRecipientRow = {
    user_id: number;
    role_code: RoleCode;
    email: string;
    first_name: string;
    last_name: string;
};

type StudentRiskContextRow = {
    student_id: number;
    control_number: string;
    student_name: string;
    group_id: number | null;
    group_code: string | null;
    group_name: string | null;
};

export type StudentRiskRecipientRecord = {
    userId: number;
    roleCode: RoleCode;
    email: string;
    firstName: string;
    lastName: string;
};

export type StudentRiskNotificationContextRecord = {
    studentId: number;
    controlNumber: string;
    studentName: string;
    groupId: number | null;
    groupCode: string | null;
    groupName: string | null;
};

function mapNotificationRow(row: NotificationRow): NotificationDto {
    return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        contextType: row.context_type,
        contextId: row.context_id,
        isRead: row.is_read === 1,
        readAt: row.read_at,
        createdAt: row.created_at,
    };
}

export function listNotificationsByUser(
    userId: number,
    options?: {
        limit?: number;
        unreadOnly?: boolean;
    },
): NotificationDto[] {
    const where = ["user_id = ?"];
    const params: Array<number> = [userId];

    if (options?.unreadOnly) {
        where.push("is_read = 0");
    }

    const limit = options?.limit ?? 20;

    const rows = query<NotificationRow>(
        `
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            link,
            context_type,
            context_id,
            is_read,
            read_at,
            created_at
        FROM notifications
        WHERE ${where.join(" AND ")}
        ORDER BY
            is_read ASC,
            created_at DESC,
            id DESC
        LIMIT ?
        `,
        [...params, limit],
    );

    return rows.map(mapNotificationRow);
}

export function countUnreadNotificationsByUser(userId: number): number {
    const row = queryOne<{ total: number }>(
        `
        SELECT COUNT(*) AS total
        FROM notifications
        WHERE user_id = ?
          AND is_read = 0
        `,
        [userId],
    );

    return row?.total ?? 0;
}

export function getNotificationByIdForUser(
    notificationId: number,
    userId: number,
): NotificationDto | null {
    const row = queryOne<NotificationRow>(
        `
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            link,
            context_type,
            context_id,
            is_read,
            read_at,
            created_at
        FROM notifications
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [notificationId, userId],
    );

    return row ? mapNotificationRow(row) : null;
}

export function markNotificationAsRead(
    notificationId: number,
    userId: number,
): number {
    const result = execute(
        `
        UPDATE notifications
        SET
            is_read = 1,
            read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
        WHERE id = ?
          AND user_id = ?
          AND is_read = 0
        `,
        [notificationId, userId],
    );

    return Number(result.changes ?? 0);
}

export function createNotification(input: {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string | null;
    contextType?: NotificationContextType | null;
    contextId?: number | null;
}) {
    const result = execute(
        `
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link,
            context_type,
            context_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            input.userId,
            input.type,
            input.title,
            input.message,
            input.link ?? null,
            input.contextType ?? null,
            input.contextId ?? null,
        ],
    );

    return Number(result.lastInsertRowid);
}

export function createNotifications(
    items: Array<{
        userId: number;
        type: NotificationType;
        title: string;
        message: string;
        link?: string | null;
        contextType?: NotificationContextType | null;
        contextId?: number | null;
    }>,
) {
    for (const item of items) {
        createNotification(item);
    }

    return items.length;
}

export function listActiveUsersByRoles(roles: readonly RoleCode[]) {
    if (roles.length === 0) {
        return [] as UserRoleRecipientRow[];
    }

    const placeholders = roles.map(() => "?").join(", ");

    return query<UserRoleRecipientRow>(
        `
        SELECT DISTINCT
            u.id AS user_id,
            r.code AS role_code
        FROM users u
        INNER JOIN user_roles ur
            ON ur.user_id = u.id
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE u.is_active = 1
          AND r.code IN (${placeholders})
        ORDER BY u.id ASC
        `,
        [...roles],
    );
}

export function getStudentRiskNotificationContext(
    studentId: number,
): StudentRiskNotificationContextRecord | null {
    const row = queryOne<StudentRiskContextRow>(
        `
        SELECT
            s.id AS student_id,
            s.control_number,
            TRIM(
                s.first_name || ' ' ||
                s.last_name || ' ' ||
                COALESCE(s.second_last_name, '')
            ) AS student_name,
            g.id AS group_id,
            g.code AS group_code,
            g.name AS group_name
        FROM students s
        LEFT JOIN group_students gs
            ON gs.student_id = s.id
        LEFT JOIN groups g
            ON g.id = gs.group_id
        WHERE s.id = ?
        ORDER BY gs.created_at DESC, gs.id DESC
        LIMIT 1
        `,
        [studentId],
    );

    if (!row) {
        return null;
    }

    return {
        studentId: row.student_id,
        controlNumber: row.control_number,
        studentName: row.student_name,
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
    };
}

export function listRiskRedRecipientsForStudent(
    studentId: number,
): StudentRiskRecipientRecord[] {
    const rows = query<StudentRiskRecipientRow>(
        `
        SELECT DISTINCT
            u.id AS user_id,
            r.code AS role_code,
            u.email,
            u.first_name,
            u.last_name
        FROM users u
        INNER JOIN user_roles ur
            ON ur.user_id = u.id
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE u.is_active = 1
          AND r.code = ?

        UNION

        SELECT DISTINCT
            tutor_user.id AS user_id,
            tutor_role.code AS role_code,
            tutor_user.email,
            tutor_user.first_name,
            tutor_user.last_name
        FROM students s
        INNER JOIN group_students gs
            ON gs.student_id = s.id
        INNER JOIN group_tutors gt
            ON gt.group_id = gs.group_id
        INNER JOIN users tutor_user
            ON tutor_user.id = gt.tutor_user_id
        INNER JOIN user_roles tutor_user_role
            ON tutor_user_role.user_id = tutor_user.id
        INNER JOIN roles tutor_role
            ON tutor_role.id = tutor_user_role.role_id
        WHERE s.id = ?
          AND tutor_user.is_active = 1
          AND tutor_role.code = ?

        ORDER BY user_id ASC
        `,
        [ROLE.DIRECTOR, studentId, ROLE.TUTOR],
    );

    const recipientMap = new Map<number, StudentRiskRecipientRecord>();

    for (const row of rows) {
        const existing = recipientMap.get(row.user_id);

        if (existing) {
            if (existing.roleCode !== ROLE.DIRECTOR && row.role_code === ROLE.DIRECTOR) {
                recipientMap.set(row.user_id, {
                    userId: row.user_id,
                    roleCode: row.role_code,
                    email: row.email,
                    firstName: row.first_name,
                    lastName: row.last_name,
                });
            }

            continue;
        }

        recipientMap.set(row.user_id, {
            userId: row.user_id,
            roleCode: row.role_code,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
        });
    }

    return Array.from(recipientMap.values());
}