import type { SupportCaseListItemDto } from "@/shared/dtos/support/support.dto";
import type { SupportAreaConfig } from "@/shared/lib/support-area-routing";
import Link from "next/link";


type Props = {
    area: SupportAreaConfig;
    cases: SupportCaseListItemDto[];
};

export function SupportAreaDashboard({ area, cases }: Props) {
    const openCases = cases.filter((item) => item.status === "OPEN");
    const closedCases = cases.filter((item) => item.status === "CLOSED");
    const recentCases = cases.slice(0, 5);

    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Área de apoyo</p>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                    Dashboard de {area.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                    Aquí se muestran únicamente los casos asignados a {area.title}.
                    Nada de mezclar bandejas, porque aparentemente la separación de
                    responsabilidades todavía tiene que defenderse en pleno siglo XXI.
                </p>

                <div className="mt-6">
                    <Link href={area.casesPath} className="ap-button-primary">
                        Ir a casos de {area.shortTitle}
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Casos asignados</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {cases.length}
                    </p>
                </article>

                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Casos abiertos</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {openCases.length}
                    </p>
                </article>

                <article className="ap-panel p-5">
                    <p className="text-sm text-[var(--color-text-soft)]">Casos cerrados</p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                        {closedCases.length}
                    </p>
                </article>
            </section>

            <section className="ap-panel p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Casos recientes
                        </h2>
                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                            Últimos casos asignados a {area.title}.
                        </p>
                    </div>

                    <Link href={area.casesPath} className="ap-button-secondary">
                        Ver todos
                    </Link>
                </div>

                {recentCases.length === 0 ? (
                    <div className="ap-panel-muted p-6 text-sm text-[var(--color-text-soft)]">
                        No hay casos asignados a esta área.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentCases.map((caseItem) => (
                            <Link
                                key={caseItem.id}
                                href={`${area.casesPath}/${caseItem.id}`}
                                className="ap-panel-muted block p-4 transition hover:border-[var(--color-brand-300)]"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-[var(--color-text)]">
                                            {caseItem.studentFullName}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                                            {caseItem.groupCode} · {caseItem.groupName} · {caseItem.reasonName}
                                        </p>
                                    </div>

                                    <span className="ap-badge ap-badge-brand">
                                        {caseItem.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}