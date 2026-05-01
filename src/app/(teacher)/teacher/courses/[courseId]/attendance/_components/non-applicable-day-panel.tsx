import type { CourseAttendanceNonApplicableDayDto } from "@/shared/dtos/teacher/attendance.dto";


type NonApplicableDayPanelProps = {
    disabled: boolean;
    nonApplicableDay: CourseAttendanceNonApplicableDayDto | null;
    reason: string;
    saving: boolean;
    onReasonChange: (value: string) => void;
    onMark: () => void;
    onUnmark: () => void;
};

export function NonApplicableDayPanel({
    disabled,
    nonApplicableDay,
    reason,
    saving,
    onReasonChange,
    onMark,
    onUnmark,
}: NonApplicableDayPanelProps) {
    const isMarked = Boolean(nonApplicableDay);

    return (
        <section className="ap-panel p-6">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                    <p className="ap-eyebrow">No aplica</p>

                    <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Bloquear asistencia del día para este curso
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        Usa esta opción si hoy no hubo clase de esta materia. Al marcar “no
                        aplica”, se eliminan las asistencias individuales capturadas para hoy
                        y la tabla queda bloqueada. Es una especie de botón de “no finjamos
                        que hubo clase”.
                    </p>
                </div>

                <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                        Estado de captura
                    </p>

                    <div className="mt-3">
                        {isMarked ? (
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                                Marcado como no aplica
                            </span>
                        ) : (
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                                Captura permitida
                            </span>
                        )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        {isMarked
                            ? "La lista de asistencia está bloqueada para este curso en el día actual."
                            : "Puedes capturar asistencia normal mientras el día sea hábil."}
                    </p>
                </div>
            </div>

            {isMarked ? (
                <div className="ap-message ap-message-error mt-5">
                    Este día está marcado como no aplica.
                    {nonApplicableDay?.reason ? ` Motivo: ${nonApplicableDay.reason}` : ""}
                </div>
            ) : null}

            {disabled && !isMarked ? (
                <div className="ap-panel-muted mt-5 p-4 text-sm leading-6 text-[var(--color-text-soft)]">
                    No puedes marcar “no aplica” porque hoy no es día hábil para captura.
                </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="ap-field">
                    <label className="ap-label">Motivo opcional</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(event) => onReasonChange(event.target.value)}
                        disabled={disabled || isMarked || saving}
                        className="ap-input"
                        placeholder="Ej. suspensión de clase, actividad institucional, práctica externa..."
                    />
                </div>

                {isMarked ? (
                    <button
                        type="button"
                        onClick={onUnmark}
                        disabled={disabled || saving}
                        className="ap-button-secondary"
                    >
                        {saving ? "Actualizando..." : "Quitar no aplica"}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onMark}
                        disabled={disabled || saving}
                        className="ap-button-secondary"
                    >
                        {saving ? "Guardando..." : "Marcar no aplica"}
                    </button>
                )}
            </div>
        </section>
    );
}