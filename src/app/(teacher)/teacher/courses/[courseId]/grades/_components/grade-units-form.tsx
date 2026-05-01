"use client";

type DraftGradeUnit = {
    id: string;
    name: string;
    sortOrder: number;
    weightPercentage: string;
};

type GradeUnitsFormProps = {
    units: DraftGradeUnit[];
    saving: boolean;
    isLocked: boolean;
    onAddUnit: () => void;
    onRemoveUnit: (id: string) => void;
    onChangeUnit: (
        id: string,
        field: "name" | "sortOrder" | "weightPercentage",
        value: string,
    ) => void;
    onSave: () => void;
};

function getTotalWeight(units: DraftGradeUnit[]) {
    const total = units.reduce((sum, unit) => {
        const parsed = Number(unit.weightPercentage);
        return sum + (Number.isFinite(parsed) ? parsed : 0);
    }, 0);

    return Number(total.toFixed(2));
}

function hasEmptyRequiredFields(units: DraftGradeUnit[]) {
    return units.some((unit) => {
        const nameIsEmpty = unit.name.trim() === "";
        const weight = Number(unit.weightPercentage);
        const weightIsInvalid = !Number.isFinite(weight) || weight <= 0;

        return nameIsEmpty || weightIsInvalid;
    });
}

export function GradeUnitsForm({
    units,
    saving,
    isLocked,
    onAddUnit,
    onRemoveUnit,
    onChangeUnit,
    onSave,
}: GradeUnitsFormProps) {
    const totalWeight = getTotalWeight(units);
    const isValidTotal = totalWeight === 100;
    const hasInvalidFields = hasEmptyRequiredFields(units);
    const canSave =
        !saving &&
        !isLocked &&
        units.length > 0 &&
        isValidTotal &&
        !hasInvalidFields;

    return (
        <section className="ap-panel p-6">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                    <p className="ap-eyebrow">Evaluación</p>

                    <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">
                        Configuración de unidades
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                        Define las unidades de evaluación del curso. La suma de porcentajes
                        debe ser exactamente 100. Una regla matemática, no una sugerencia
                        emocional.
                    </p>
                </div>

                <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                        Estado de configuración
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${isLocked
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-sky-200 bg-sky-50 text-sky-800"
                                }`}
                        >
                            {isLocked ? "Bloqueada" : "Editable"}
                        </span>

                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${isValidTotal
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-amber-200 bg-amber-50 text-amber-800"
                                }`}
                        >
                            Suma: {totalWeight}%
                        </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        {isLocked
                            ? "Las unidades ya fueron guardadas y no se pueden modificar."
                            : "Al guardar por primera vez, las unidades quedarán fijas."}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onAddUnit}
                    disabled={isLocked}
                    className="ap-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Agregar unidad
                </button>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={!canSave}
                    className="ap-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar configuración"}
                </button>
            </div>

            {isLocked ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                    La configuración de unidades ya fue guardada y quedó bloqueada. Ya no se
                    puede modificar desde esta pantalla.
                </div>
            ) : (
                <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-900">
                    Cuando guardes esta configuración por primera vez, las unidades quedarán
                    fijas. Revisa nombres y porcentajes antes de guardar.
                </div>
            )}

            {!isLocked && hasInvalidFields ? (
                <div className="ap-message ap-message-error mt-4">
                    Todas las unidades deben tener nombre y porcentaje mayor a 0.
                </div>
            ) : null}

            {!isLocked && !isValidTotal ? (
                <div className="ap-message ap-message-error mt-4">
                    La suma de porcentajes debe ser exactamente 100.
                </div>
            ) : null}

            {units.length === 0 ? (
                <div className="ap-panel-muted mt-6 p-6 text-sm text-[var(--color-text-soft)]">
                    Todavía no hay unidades configuradas.
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[var(--color-border)] text-[var(--color-text-soft)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Orden</th>
                                <th className="px-4 py-3 font-semibold">Nombre</th>
                                <th className="px-4 py-3 font-semibold">Porcentaje</th>
                                <th className="px-4 py-3 font-semibold">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {units.map((unit) => {
                                const weight = Number(unit.weightPercentage);
                                const weightIsInvalid =
                                    !Number.isFinite(weight) || weight <= 0;

                                return (
                                    <tr
                                        key={unit.id}
                                        className="border-b border-[var(--color-border)]/70 align-top"
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={1}
                                                step={1}
                                                value={unit.sortOrder}
                                                onChange={(event) =>
                                                    onChangeUnit(
                                                        unit.id,
                                                        "sortOrder",
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={isLocked}
                                                className="ap-input w-28 disabled:cursor-not-allowed disabled:opacity-60"
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={unit.name}
                                                onChange={(event) =>
                                                    onChangeUnit(
                                                        unit.id,
                                                        "name",
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={isLocked}
                                                placeholder="Ej. Examen 1"
                                                className="ap-input min-w-[240px] disabled:cursor-not-allowed disabled:opacity-60"
                                            />

                                            {!isLocked && unit.name.trim() === "" ? (
                                                <p className="mt-1 text-xs text-rose-700">
                                                    El nombre es obligatorio.
                                                </p>
                                            ) : null}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step="0.01"
                                                    value={unit.weightPercentage}
                                                    onChange={(event) =>
                                                        onChangeUnit(
                                                            unit.id,
                                                            "weightPercentage",
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={isLocked}
                                                    className="ap-input w-32 disabled:cursor-not-allowed disabled:opacity-60"
                                                />

                                                <span className="text-[var(--color-text-soft)]">
                                                    %
                                                </span>
                                            </div>

                                            {!isLocked && weightIsInvalid ? (
                                                <p className="mt-1 text-xs text-rose-700">
                                                    Debe ser mayor a 0.
                                                </p>
                                            ) : null}
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => onRemoveUnit(unit.id)}
                                                disabled={units.length === 1 || isLocked}
                                                className="font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}