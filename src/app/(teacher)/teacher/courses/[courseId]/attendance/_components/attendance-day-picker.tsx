type AttendanceDayPickerProps = {
    dayLabel: string;
    date: string;
    isBusinessDay: boolean;
};

function formatDate(value: string) {
    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
}

export function AttendanceDayPicker({
    dayLabel,
    date,
    isBusinessDay,
}: AttendanceDayPickerProps) {
    return (
        <section className="ap-panel p-6">
            <p className="ap-eyebrow">Día de captura</p>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                    <h2 className="text-2xl font-semibold capitalize text-[var(--color-text)]">
                        {dayLabel}
                    </h2>

                    <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                        Fecha automática del sistema:{" "}
                        <span className="font-semibold text-[var(--color-text)]">
                            {formatDate(date)}
                        </span>
                    </p>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        La asistencia se captura únicamente para el día actual. No se
                        permite modificar días pasados ni registrar días futuros. Una regla
                        aburrida, pero justo por eso útil.
                    </p>
                </div>

                <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                        Estado del día
                    </p>

                    <div className="mt-3">
                        <span
                            className={
                                isBusinessDay
                                    ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
                                    : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800"
                            }
                        >
                            {isBusinessDay ? "Día hábil" : "Día no hábil"}
                        </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        {isBusinessDay
                            ? "Puedes capturar asistencia para este curso, salvo que lo marques como no aplica."
                            : "Hoy no se permite captura porque no corresponde a lunes-viernes."}
                    </p>
                </div>
            </div>

            {!isBusinessDay ? (
                <div className="ap-message ap-message-error mt-5">
                    Hoy no se puede capturar asistencia porque no es lunes a viernes.
                </div>
            ) : null}
        </section>
    );
}