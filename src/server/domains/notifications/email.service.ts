import { ROLE } from "@/shared/enums/roles";
import { query } from "@/server/db/queries";
import nodemailer from "nodemailer";


type RecipientRow = {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
};

type ReferralCreatedEmailInput = {
    actorUserId: number;
    actorName: string;
    studentName: string;
    groupCode: string;
    reasonName: string;
    targetArea: "PEDAGOGY" | "PSYCHOLOGY";
    summary: string;
    caseId: number;
};

type IncidentEmailInput = {
    recipientUserIds: number[];
    actorName: string;
    studentName: string;
    groupCode: string | null;
    subjectName: string | null;
    typeName: string;
    note: string;
    incidentId: number;
    eventLabel: string;
};

type StudentRiskRedEmailInput = {
    recipientUserIds: number[];
    studentName: string;
    controlNumber: string;
    groupCode: string | null;
    groupName: string | null;
    redCausesCount: number;
    yellowCausesCount: number;
    topCauses: string[];
};

type EmailRecipient = {
    userId: number;
    email: string;
    fullName: string;
};

export type SafeEmailResult = {
    attempted: boolean;
    sent: boolean;
    error: string | null;
};

type EmailDeliverySummary = {
    attempted: boolean;
    sentCount: number;
    failedCount: number;
    skippedCount: number;
    warnings: string[];
};

function buildFullName(firstName: string | null, lastName: string | null) {
    return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getBaseUrl() {
    return (
        process.env.APP_BASE_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        "http://localhost:3000"
    );
}

function getTargetAreaLabel(targetArea: "PEDAGOGY" | "PSYCHOLOGY") {
    return targetArea === "PEDAGOGY" ? "Pedagogía" : "Psicología";
}

function getTargetAreaRole(targetArea: "PEDAGOGY" | "PSYCHOLOGY") {
    return targetArea === "PEDAGOGY" ? ROLE.PEDAGOGIA : ROLE.PSICOLOGIA;
}

function getTransportConfig() {
    const user = process.env.GMAIL_SMTP_USER?.trim();
    const pass = process.env.GMAIL_SMTP_APP_PASSWORD?.trim();

    if (!user || !pass) {
        return null;
    }

    return {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user,
            pass,
        },
    };
}

function getFromHeader() {
    const smtpUser = process.env.GMAIL_SMTP_USER?.trim();
    const fromName = process.env.GMAIL_SMTP_FROM_NAME?.trim() || "AulaPulse";

    if (!smtpUser) {
        return undefined;
    }

    return `${fromName} <${smtpUser}>`;
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toSafeEmailResult(summary: EmailDeliverySummary): SafeEmailResult {
    if (!summary.attempted) {
        return {
            attempted: false,
            sent: false,
            error: summary.warnings.length > 0 ? summary.warnings.join(" | ") : null,
        };
    }

    return {
        attempted: true,
        sent: summary.sentCount > 0,
        error: summary.warnings.length > 0 ? summary.warnings.join(" | ") : null,
    };
}

function uniqueRecipientsFromRows(rows: RecipientRow[]): EmailRecipient[] {
    const uniqueByUserId = new Map<number, EmailRecipient>();

    for (const row of rows) {
        const email = row.email?.trim().toLowerCase() ?? "";

        if (!uniqueByUserId.has(row.user_id)) {
            uniqueByUserId.set(row.user_id, {
                userId: row.user_id,
                email,
                fullName: buildFullName(row.first_name, row.last_name),
            });
        }
    }

    return Array.from(uniqueByUserId.values());
}

function listReferralRecipientsByRoleAndActor(
    actorUserId: number,
    targetArea: "PEDAGOGY" | "PSYCHOLOGY",
): EmailRecipient[] {
    const rows = query<RecipientRow>(
        `
        SELECT DISTINCT
            u.id AS user_id,
            u.email,
            u.first_name,
            u.last_name
        FROM users u
        INNER JOIN user_roles ur
            ON ur.user_id = u.id
        INNER JOIN roles r
            ON r.id = ur.role_id
        WHERE u.is_active = 1
          AND (
                r.code = ?
                OR r.code = ?
                OR u.id = ?
          )
        ORDER BY u.id ASC
        `,
        [ROLE.DIRECTOR, getTargetAreaRole(targetArea), actorUserId],
    );

    return uniqueRecipientsFromRows(rows);
}

function listRecipientsByUserIds(userIds: number[]): EmailRecipient[] {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
        return [];
    }

    const placeholders = uniqueUserIds.map(() => "?").join(", ");

    const rows = query<RecipientRow>(
        `
        SELECT DISTINCT
            id AS user_id,
            email,
            first_name,
            last_name
        FROM users
        WHERE is_active = 1
          AND id IN (${placeholders})
        ORDER BY id ASC
        `,
        uniqueUserIds,
    );

    return uniqueRecipientsFromRows(rows);
}

async function sendEmailToRecipientsSafely(input: {
    recipients: EmailRecipient[];
    subject: string;
    text: string;
    logLabel: string;
}): Promise<EmailDeliverySummary> {
    const transportConfig = getTransportConfig();

    if (!transportConfig) {
        const warning = "Gmail SMTP no está configurado. Se creó la notificación interna, pero no se envió correo.";

        console.warn(`[notifications/email] ${warning}`);

        return {
            attempted: false,
            sentCount: 0,
            failedCount: 0,
            skippedCount: 0,
            warnings: [warning],
        };
    }

    if (input.recipients.length === 0) {
        const warning = "No hay destinatarios activos para enviar correo.";

        console.warn(`[notifications/email] ${warning}`);

        return {
            attempted: false,
            sentCount: 0,
            failedCount: 0,
            skippedCount: 0,
            warnings: [warning],
        };
    }

    const transporter = nodemailer.createTransport(transportConfig);
    const warnings: string[] = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const recipient of input.recipients) {
        if (!recipient.email || !isValidEmail(recipient.email)) {
            skippedCount += 1;

            const label = recipient.fullName || `Usuario ${recipient.userId}`;
            const warning = `Correo inválido omitido para ${label}: ${recipient.email || "sin correo"}.`;

            warnings.push(warning);
            console.warn(`[notifications/email] ${warning}`);
            continue;
        }

        try {
            await transporter.sendMail({
                from: getFromHeader(),
                to: recipient.email,
                subject: input.subject,
                text: input.text,
            });

            sentCount += 1;
        } catch (error) {
            failedCount += 1;

            const label = recipient.fullName || `Usuario ${recipient.userId}`;
            const message =
                error instanceof Error
                    ? error.message
                    : "Error desconocido al enviar correo.";

            const warning = `No se pudo enviar correo a ${label} <${recipient.email}>: ${message}`;

            warnings.push(warning);

            console.error(
                `[notifications/email] Error enviando ${input.logLabel}:`,
                error,
            );
        }
    }

    if (sentCount === 0 && failedCount === 0 && skippedCount > 0) {
        warnings.push(
            "No se envió ningún correo porque todos los destinatarios tenían correo inválido.",
        );
    }

    return {
        attempted: sentCount > 0 || failedCount > 0,
        sentCount,
        failedCount,
        skippedCount,
        warnings,
    };
}

function buildReferralCreatedEmail(input: ReferralCreatedEmailInput) {
    const baseUrl = getBaseUrl();
    const areaLabel = getTargetAreaLabel(input.targetArea);

    const directorUrl = `${baseUrl}/director/referrals/${input.caseId}`;
    const supportAreaUrl =
        input.targetArea === "PEDAGOGY"
            ? `${baseUrl}/pedagogia/cases/${input.caseId}`
            : `${baseUrl}/psicologia/cases/${input.caseId}`;

    const subject = `[AulaPulse] Nueva canalización: ${input.studentName} · ${input.groupCode}`;

    const text = [
        "Se registró una nueva canalización en AulaPulse.",
        "",
        `Alumno: ${input.studentName}`,
        `Grupo: ${input.groupCode}`,
        `Motivo: ${input.reasonName}`,
        `Área destino: ${areaLabel}`,
        `Registrado por: ${input.actorName}`,
        "",
        "Resumen:",
        input.summary,
        "",
        "Accesos directos:",
        `Director: ${directorUrl}`,
        `${areaLabel}: ${supportAreaUrl}`,
        "",
        "Mensaje automático de AulaPulse.",
    ].join("\n");

    return {
        subject,
        text,
    };
}

function buildIncidentEmail(input: IncidentEmailInput) {
    const baseUrl = getBaseUrl();
    const directorUrl = `${baseUrl}/director/incidents/${input.incidentId}`;
    const tutorUrl = `${baseUrl}/tutor/incidents/${input.incidentId}`;

    const subject = `[AulaPulse] ${input.eventLabel}: ${input.studentName}`;

    const text = [
        `${input.eventLabel} en AulaPulse.`,
        "",
        `Alumno: ${input.studentName}`,
        `Grupo: ${input.groupCode ?? "Sin grupo definido"}`,
        `Materia: ${input.subjectName ?? "General"}`,
        `Tipo: ${input.typeName}`,
        `Registrado/actualizado por: ${input.actorName}`,
        "",
        "Nota:",
        input.note,
        "",
        "Accesos directos:",
        `Director: ${directorUrl}`,
        `Tutor: ${tutorUrl}`,
        "",
        "Mensaje automático de AulaPulse.",
    ].join("\n");

    return {
        subject,
        text,
    };
}

function buildStudentRiskRedEmail(input: StudentRiskRedEmailInput) {
    const baseUrl = getBaseUrl();

    const directorUrl = `${baseUrl}/director/students`;
    const tutorUrl = `${baseUrl}/tutor/groups`;

    const subject = `[AulaPulse] Semáforo rojo: ${input.studentName}`;

    const causes =
        input.topCauses.length > 0
            ? input.topCauses.map((cause, index) => `${index + 1}. ${cause}`)
            : ["No se registraron causas específicas."];

    const text = [
        "Un alumno cambió a semáforo rojo en AulaPulse.",
        "",
        `Alumno: ${input.studentName}`,
        `Número de control: ${input.controlNumber}`,
        `Grupo: ${input.groupCode ?? "Sin grupo definido"}`,
        `Nombre del grupo: ${input.groupName ?? "Sin grupo definido"}`,
        "",
        `Causas rojas: ${input.redCausesCount}`,
        `Causas amarillas: ${input.yellowCausesCount}`,
        "",
        "Principales causas:",
        ...causes,
        "",
        "Accesos directos:",
        `Director: ${directorUrl}`,
        `Tutor: ${tutorUrl}`,
        "",
        "Mensaje automático de AulaPulse.",
    ].join("\n");

    return {
        subject,
        text,
    };
}

export async function sendReferralCreatedEmailSafely(
    input: ReferralCreatedEmailInput,
): Promise<SafeEmailResult> {
    const recipients = listReferralRecipientsByRoleAndActor(
        input.actorUserId,
        input.targetArea,
    );

    const emailContent = buildReferralCreatedEmail(input);

    const summary = await sendEmailToRecipientsSafely({
        recipients,
        subject: emailContent.subject,
        text: emailContent.text,
        logLabel: "correo de canalización creada",
    });

    return toSafeEmailResult(summary);
}

export async function sendIncidentEmailSafely(
    input: IncidentEmailInput,
): Promise<SafeEmailResult> {
    const recipients = listRecipientsByUserIds(input.recipientUserIds);
    const emailContent = buildIncidentEmail(input);

    const summary = await sendEmailToRecipientsSafely({
        recipients,
        subject: emailContent.subject,
        text: emailContent.text,
        logLabel: "correo de incidencia",
    });

    return toSafeEmailResult(summary);
}

export async function sendStudentRiskRedEmailSafely(
    input: StudentRiskRedEmailInput,
): Promise<SafeEmailResult> {
    const recipients = listRecipientsByUserIds(input.recipientUserIds);
    const emailContent = buildStudentRiskRedEmail(input);

    const summary = await sendEmailToRecipientsSafely({
        recipients,
        subject: emailContent.subject,
        text: emailContent.text,
        logLabel: "correo de semáforo rojo",
    });

    return toSafeEmailResult(summary);
}