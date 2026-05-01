import type { IncidentStatusDto } from "@/shared/dtos/incidents/incidents.dto";


type IncidentStatusBadgeProps = {
    status: IncidentStatusDto;
    size?: "sm" | "md";
};

function getStatusLabel(status: IncidentStatusDto) {
    if (status === "OPEN") {
        return "Abierta";
    }

    return "Cerrada";
}

function getStatusClassName(status: IncidentStatusDto) {
    if (status === "OPEN") {
        return "border-rose-200 bg-rose-50 text-rose-800";
    }

    return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusDotClassName(status: IncidentStatusDto) {
    if (status === "OPEN") {
        return "bg-rose-500";
    }

    return "bg-slate-500";
}

function getSizeClassName(size: "sm" | "md") {
    if (size === "sm") {
        return "ap-status-badge-sm";
    }

    return "";
}

export function IncidentStatusBadge({
    status,
    size = "md",
}: IncidentStatusBadgeProps) {
    return (
        <span
            className={[
                "ap-status-badge",
                getStatusClassName(status),
                getSizeClassName(size),
            ].join(" ")}
        >
            <span
                aria-hidden="true"
                className={[
                    "ap-status-dot",
                    getStatusDotClassName(status),
                ].join(" ")}
            />

            {getStatusLabel(status)}
        </span>
    );
}