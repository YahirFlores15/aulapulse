import type { AddIncidentNoteResponseDto, CloseIncidentResponseDto, CreateIncidentResponseDto, IncidentDetailDto, IncidentListQueryDto, IncidentListResponseDto, ReopenIncidentResponseDto, } from "@/shared/dtos/incidents/incidents.dto";
import type { AddIncidentNoteInput, CloseIncidentInput, CreateIncidentInput, ReopenIncidentInput, } from "@/shared/schemas/incidents/incidents.schema";
import { calculateAndPersistStudentTrafficLight } from "@/server/domains/risk/service";
import type { ValidatedSession } from "@/server/auth/types";
import { ROLE } from "@/shared/enums/roles";

import { closeIncident, createIncident, createIncidentNote, getIncidentById, getIncidentTypeByCode, getStudentIdentity, listIncidentEvents, listIncidentNotes, listIncidentsForDirector, listIncidentsForTeacher, listIncidentsForTutor, reopenIncident, } from "./repo";
import { ensureActorStillHasOperationalRole, ensureCanAccessIncident, ensureCanAddIncidentNote, ensureCanCloseIncident, ensureCanListIncidents, ensureCanReopenIncident, resolveIncidentCreationContext, } from "./policies";
import { createIncidentInvalidStatusError, createIncidentNotFoundError, createIncidentValidationError, } from "./errors";
import { notifyIncidentEvent } from "./notifications";


function buildActorContext(session: ValidatedSession) {
    return {
        userId: session.userId,
        activeRole: session.activeRole,
    };
}

function buildIncidentDetail(incidentId: number): IncidentDetailDto {
    const incident = getIncidentById(incidentId);

    if (!incident) {
        throw createIncidentNotFoundError();
    }

    return {
        incident,
        notes: listIncidentNotes(incidentId),
        events: listIncidentEvents(incidentId),
    };
}

function getActorName(session: ValidatedSession) {
    return session.email;
}

export class IncidentService {
    listIncidents(
        session: ValidatedSession,
        query: IncidentListQueryDto,
    ): IncidentListResponseDto {
        const actor = buildActorContext(session);

        ensureCanListIncidents(actor);
        ensureActorStillHasOperationalRole(actor);

        if (actor.activeRole === ROLE.DIRECTOR) {
            return {
                items: listIncidentsForDirector(query),
            };
        }

        if (actor.activeRole === ROLE.TEACHER) {
            return {
                items: listIncidentsForTeacher(actor.userId, query),
            };
        }

        if (actor.activeRole === ROLE.TUTOR) {
            return {
                items: listIncidentsForTutor(actor.userId, query),
            };
        }

        return {
            items: [],
        };
    }

    getIncidentDetail(
        session: ValidatedSession,
        incidentId: number,
    ): IncidentDetailDto {
        const actor = buildActorContext(session);
        const detail = buildIncidentDetail(incidentId);

        ensureCanAccessIncident(actor, detail.incident);

        return detail;
    }

    async createIncident(
        session: ValidatedSession,
        input: CreateIncidentInput,
    ): Promise<CreateIncidentResponseDto> {
        const actor = buildActorContext(session);

        ensureCanListIncidents(actor);
        ensureActorStillHasOperationalRole(actor);

        const student = getStudentIdentity(input.studentId);

        if (!student) {
            throw createIncidentValidationError("El alumno no existe o está inactivo.");
        }

        const incidentType = getIncidentTypeByCode(input.typeCode);

        if (!incidentType || !incidentType.isActive) {
            throw createIncidentValidationError(
                "El tipo de incidencia no existe o está inactivo.",
            );
        }

        const context = resolveIncidentCreationContext(actor, {
            studentId: input.studentId,
            courseId: input.courseId ?? null,
            groupId: input.groupId ?? null,
        });

        const incidentId = createIncident({
            studentId: input.studentId,
            typeCode: input.typeCode,
            createdByUserId: actor.userId,
            note: input.note,
            status: "OPEN",
            courseId: context.courseId,
            groupId: context.groupId,
            sourceRole: actor.activeRole as "DIRECTOR" | "TEACHER" | "TUTOR",
        });

        calculateAndPersistStudentTrafficLight(input.studentId);

        const incident = getIncidentById(incidentId);

        if (!incident) {
            throw createIncidentValidationError(
                "No se pudo recuperar la incidencia recién creada.",
            );
        }

        const notificationStatus = await notifyIncidentEvent({
            actorUserId: actor.userId,
            actorName: getActorName(session),
            event: "CREATED",
            incident,
            noteForEmail: input.note,
        });

        return {
            incident,
            notificationStatus,
        };
    }

    async addIncidentNote(
        session: ValidatedSession,
        incidentId: number,
        input: AddIncidentNoteInput,
    ): Promise<AddIncidentNoteResponseDto> {
        const actor = buildActorContext(session);
        const currentIncident = getIncidentById(incidentId);

        if (!currentIncident) {
            throw createIncidentNotFoundError();
        }

        ensureCanAddIncidentNote(actor, currentIncident);

        if (currentIncident.status === "CLOSED") {
            throw createIncidentInvalidStatusError(
                "No se pueden agregar notas a una incidencia cerrada.",
            );
        }

        createIncidentNote({
            incidentId,
            authorUserId: actor.userId,
            note: input.note,
        });

        const detail = buildIncidentDetail(incidentId);

        const notificationStatus = await notifyIncidentEvent({
            actorUserId: actor.userId,
            actorName: getActorName(session),
            event: "NOTE_ADDED",
            incident: detail.incident,
            noteForEmail: input.note,
        });

        return {
            detail,
            notificationStatus,
        };
    }

    async closeIncident(
        session: ValidatedSession,
        incidentId: number,
        input: CloseIncidentInput,
    ): Promise<CloseIncidentResponseDto> {
        const actor = buildActorContext(session);
        const currentIncident = getIncidentById(incidentId);

        if (!currentIncident) {
            throw createIncidentNotFoundError();
        }

        ensureCanCloseIncident(actor, currentIncident);

        if (currentIncident.status === "CLOSED") {
            throw createIncidentInvalidStatusError(
                "La incidencia ya está cerrada.",
            );
        }

        closeIncident({
            incidentId,
            actorUserId: actor.userId,
            reason: input.reason,
        });

        calculateAndPersistStudentTrafficLight(currentIncident.studentId);

        const detail = buildIncidentDetail(incidentId);

        const notificationStatus = await notifyIncidentEvent({
            actorUserId: actor.userId,
            actorName: getActorName(session),
            event: "CLOSED",
            incident: detail.incident,
            noteForEmail: input.reason,
        });

        return {
            detail,
            notificationStatus,
        };
    }

    async reopenIncident(
        session: ValidatedSession,
        incidentId: number,
        input: ReopenIncidentInput,
    ): Promise<ReopenIncidentResponseDto> {
        const actor = buildActorContext(session);
        const currentIncident = getIncidentById(incidentId);

        if (!currentIncident) {
            throw createIncidentNotFoundError();
        }

        ensureCanReopenIncident(actor, currentIncident);

        if (currentIncident.status === "OPEN") {
            throw createIncidentInvalidStatusError(
                "La incidencia ya está abierta.",
            );
        }

        reopenIncident({
            incidentId,
            actorUserId: actor.userId,
            reason: input.reason,
        });

        calculateAndPersistStudentTrafficLight(currentIncident.studentId);

        const detail = buildIncidentDetail(incidentId);

        const notificationStatus = await notifyIncidentEvent({
            actorUserId: actor.userId,
            actorName: getActorName(session),
            event: "REOPENED",
            incident: detail.incident,
            noteForEmail: input.reason,
        });

        return {
            detail,
            notificationStatus,
        };
    }
}