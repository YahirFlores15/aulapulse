import { actorHasRole, getCourseContext, getGroupContext, getPrimaryGroupForStudent, studentBelongsToCourse, studentBelongsToGroup, teacherOwnsCourse, tutorCanAccessCourse, tutorOwnsGroup, } from "@/server/domains/incidents/repo";
import type { IncidentListItemDto } from "@/shared/dtos/incidents/incidents.dto";
import { ROLE, type RoleCode } from "@/shared/enums/roles";

import { createIncidentForbiddenError, createIncidentValidationError, } from "./errors";


type ActorContext = {
    userId: number;
    activeRole: RoleCode;
};

export type ResolvedIncidentCreationContext = {
    courseId: number | null;
    groupId: number | null;
};

export function ensureCanListIncidents(actor: ActorContext): void {
    if (
        actor.activeRole !== ROLE.DIRECTOR &&
        actor.activeRole !== ROLE.TEACHER &&
        actor.activeRole !== ROLE.TUTOR
    ) {
        throw createIncidentForbiddenError();
    }
}

export function resolveIncidentCreationContext(
    actor: ActorContext,
    input: {
        studentId: number;
        courseId?: number | null;
        groupId?: number | null;
    },
): ResolvedIncidentCreationContext {
    if (actor.activeRole === ROLE.DIRECTOR) {
        if (input.courseId) {
            const course = getCourseContext(input.courseId);

            if (!course) {
                throw createIncidentValidationError("El curso indicado no existe.");
            }

            if (!studentBelongsToCourse(input.courseId, input.studentId)) {
                throw createIncidentValidationError(
                    "El alumno no pertenece al curso indicado.",
                );
            }

            return {
                courseId: input.courseId,
                groupId: course.group_id,
            };
        }

        if (input.groupId) {
            const group = getGroupContext(input.groupId);

            if (!group) {
                throw createIncidentValidationError("El grupo indicado no existe.");
            }

            if (!studentBelongsToGroup(input.groupId, input.studentId)) {
                throw createIncidentValidationError(
                    "El alumno no pertenece al grupo indicado.",
                );
            }

            return {
                courseId: null,
                groupId: input.groupId,
            };
        }

        const primaryGroup = getPrimaryGroupForStudent(input.studentId);

        return {
            courseId: null,
            groupId: primaryGroup?.group_id ?? null,
        };
    }

    if (actor.activeRole === ROLE.TEACHER) {
        if (!input.courseId) {
            throw createIncidentValidationError(
                "El docente debe registrar incidencias desde un curso.",
            );
        }

        const course = getCourseContext(input.courseId);

        if (!course) {
            throw createIncidentValidationError("El curso indicado no existe.");
        }

        if (!teacherOwnsCourse(input.courseId, actor.userId)) {
            throw createIncidentForbiddenError();
        }

        if (!studentBelongsToCourse(input.courseId, input.studentId)) {
            throw createIncidentValidationError(
                "El alumno no pertenece al curso indicado.",
            );
        }

        return {
            courseId: input.courseId,
            groupId: course.group_id,
        };
    }

    if (actor.activeRole === ROLE.TUTOR) {
        if (input.courseId) {
            const course = getCourseContext(input.courseId);

            if (!course) {
                throw createIncidentValidationError("El curso indicado no existe.");
            }

            if (!tutorCanAccessCourse(input.courseId, actor.userId)) {
                throw createIncidentForbiddenError();
            }

            if (!studentBelongsToCourse(input.courseId, input.studentId)) {
                throw createIncidentValidationError(
                    "El alumno no pertenece al curso indicado.",
                );
            }

            return {
                courseId: input.courseId,
                groupId: course.group_id,
            };
        }

        if (!input.groupId) {
            throw createIncidentValidationError(
                "El tutor debe indicar el grupo del alumno.",
            );
        }

        const group = getGroupContext(input.groupId);

        if (!group) {
            throw createIncidentValidationError("El grupo indicado no existe.");
        }

        if (!tutorOwnsGroup(input.groupId, actor.userId)) {
            throw createIncidentForbiddenError();
        }

        if (!studentBelongsToGroup(input.groupId, input.studentId)) {
            throw createIncidentValidationError(
                "El alumno no pertenece al grupo indicado.",
            );
        }

        return {
            courseId: null,
            groupId: input.groupId,
        };
    }

    throw createIncidentForbiddenError();
}

export function canAccessIncident(
    actor: ActorContext,
    incident: IncidentListItemDto,
): boolean {
    if (actor.activeRole === ROLE.DIRECTOR) {
        return true;
    }

    if (actor.activeRole === ROLE.TEACHER) {
        if (incident.createdByUserId === actor.userId) {
            return true;
        }

        if (incident.courseId && teacherOwnsCourse(incident.courseId, actor.userId)) {
            return true;
        }

        return false;
    }

    if (actor.activeRole === ROLE.TUTOR) {
        if (incident.groupId && tutorOwnsGroup(incident.groupId, actor.userId)) {
            return true;
        }

        if (incident.courseId && tutorCanAccessCourse(incident.courseId, actor.userId)) {
            return true;
        }

        return false;
    }

    return false;
}

export function ensureCanAccessIncident(
    actor: ActorContext,
    incident: IncidentListItemDto,
): void {
    if (!canAccessIncident(actor, incident)) {
        throw createIncidentForbiddenError();
    }
}

export function ensureCanCloseIncident(
    actor: ActorContext,
    incident: IncidentListItemDto,
): void {
    ensureCanAccessIncident(actor, incident);
}

export function ensureCanReopenIncident(
    actor: ActorContext,
    incident: IncidentListItemDto,
): void {
    ensureCanAccessIncident(actor, incident);
}

export function ensureCanAddIncidentNote(
    actor: ActorContext,
    incident: IncidentListItemDto,
): void {
    ensureCanAccessIncident(actor, incident);
}

export function ensureActorStillHasOperationalRole(actor: ActorContext): void {
    if (!actorHasRole(actor.userId, actor.activeRole)) {
        throw createIncidentForbiddenError();
    }
}