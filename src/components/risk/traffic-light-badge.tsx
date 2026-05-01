import type { TrafficLight } from "@/shared/enums/traffic-light";


type TrafficLightBadgeProps = {
    color: TrafficLight | null;
    label?: string;
    size?: "sm" | "md";
};

function getTrafficLightLabel(color: TrafficLight | null): string {
    if (color === "GREEN") return "Verde";
    if (color === "YELLOW") return "Amarillo";
    if (color === "RED") return "Rojo";

    return "Sin cálculo";
}

function getTrafficLightClassName(color: TrafficLight | null): string {
    if (color === "GREEN") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (color === "YELLOW") {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (color === "RED") {
        return "border-rose-200 bg-rose-50 text-rose-800";
    }

    return "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-soft)]";
}

function getTrafficLightDotClassName(color: TrafficLight | null): string {
    if (color === "GREEN") return "bg-emerald-500";
    if (color === "YELLOW") return "bg-amber-500";
    if (color === "RED") return "bg-rose-500";

    return "bg-[var(--color-text-faint)]";
}

function getSizeClassName(size: TrafficLightBadgeProps["size"]): string {
    if (size === "sm") {
        return "ap-status-badge-sm";
    }

    return "";
}

export function TrafficLightBadge({
    color,
    label,
    size = "md",
}: TrafficLightBadgeProps) {
    const resolvedLabel = label ?? getTrafficLightLabel(color);

    return (
        <span
            className={[
                "ap-status-badge",
                getTrafficLightClassName(color),
                getSizeClassName(size),
            ].join(" ")}
        >
            <span
                aria-hidden="true"
                className={[
                    "ap-status-dot",
                    getTrafficLightDotClassName(color),
                ].join(" ")}
            />
            {resolvedLabel}
        </span>
    );
}