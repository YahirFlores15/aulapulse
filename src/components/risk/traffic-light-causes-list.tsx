import type { StudentTrafficLightCauseDto } from "@/shared/dtos/risk/student-traffic-light.dto";

type TrafficLightCausesListProps = {
    causes: StudentTrafficLightCauseDto[];
    maxItems?: number;
    emptyText?: string;
};

function getCauseSeverityLabel(severity: StudentTrafficLightCauseDto["severity"]) {
    if (severity === "RED") return "Rojo";
    return "Amarillo";
}

function getCauseTypeLabel(type: StudentTrafficLightCauseDto["type"]) {
    if (type === "ATTENDANCE") return "Asistencia";
    if (type === "GRADE") return "Calificación";
    return "Incidencia";
}

function getCauseClassName(severity: StudentTrafficLightCauseDto["severity"]) {
    if (severity === "RED") {
        return "border-rose-200 bg-rose-50 text-rose-900";
    }

    return "border-amber-200 bg-amber-50 text-amber-900";
}

function formatCauseContext(cause: StudentTrafficLightCauseDto): string | null {
    const parts = [
        cause.subjectCode,
        cause.subjectName,
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(" · ");
    }

    if (cause.value !== undefined && cause.value !== null) {
        return String(cause.value);
    }

    return null;
}

export function TrafficLightCausesList({
    causes,
    maxItems = 3,
    emptyText = "Sin causas registradas.",
}: TrafficLightCausesListProps) {
    if (causes.length === 0) {
        return (
            <p className="text-sm text-[var(--color-text-soft)]">
                {emptyText}
            </p>
        );
    }

    const visibleCauses = causes.slice(0, maxItems);
    const hiddenCausesCount = Math.max(causes.length - visibleCauses.length, 0);

    return (
        <div className="space-y-2">
            {visibleCauses.map((cause, index) => {
                const context = formatCauseContext(cause);

                return (
                    <div
                        key={`${cause.type}-${cause.severity}-${cause.courseId ?? "na"}-${cause.incidentId ?? "na"}-${index}`}
                        className={[
                            "rounded-2xl border px-3 py-2 text-xs leading-5",
                            getCauseClassName(cause.severity),
                        ].join(" ")}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">
                                {getCauseTypeLabel(cause.type)}
                            </span>
                            <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold">
                                {getCauseSeverityLabel(cause.severity)}
                            </span>
                        </div>

                        <p className="mt-1">
                            {cause.message}
                        </p>

                        {context ? (
                            <p className="mt-1 opacity-80">
                                {context}
                            </p>
                        ) : null}
                    </div>
                );
            })}

            {hiddenCausesCount > 0 ? (
                <p className="text-xs font-medium text-[var(--color-text-soft)]">
                    +{hiddenCausesCount} causa(s) adicionales.
                </p>
            ) : null}
        </div>
    );
}