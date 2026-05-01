export class IncidentServiceError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(
        code: string,
        message: string,
        status = 400,
        details?: unknown,
    ) {
        super(message);
        this.name = "IncidentServiceError";
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export function createIncidentNotFoundError() {
    return new IncidentServiceError(
        "INCIDENT_NOT_FOUND",
        "Incidencia no encontrada.",
        404,
    );
}

export function createIncidentForbiddenError() {
    return new IncidentServiceError(
        "INCIDENT_FORBIDDEN",
        "No tienes permisos para operar esta incidencia.",
        403,
    );
}

export function createIncidentInvalidStatusError(message: string) {
    return new IncidentServiceError(
        "INCIDENT_INVALID_STATUS",
        message,
        409,
    );
}

export function createIncidentValidationError(message: string, details?: unknown) {
    return new IncidentServiceError(
        "INCIDENT_VALIDATION_ERROR",
        message,
        400,
        details,
    );
}