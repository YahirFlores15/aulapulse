import Link from "next/link";


type QuickLink = {
    href: string;
    title: string;
    description: string;
    category: "Base académica" | "Operación" | "Seguimiento";
};

const quickLinks: QuickLink[] = [
    {
        href: "/director/users",
        title: "Usuarios operativos",
        description: "Crea docentes y cuentas de Pedagogía o Psicología.",
        category: "Base académica",
    },
    {
        href: "/director/academic/cycles",
        title: "Ciclos automáticos",
        description: "Consulta los cuatrimestres generados por el sistema.",
        category: "Base académica",
    },
    {
        href: "/director/academic/groups",
        title: "Grupos",
        description: "Organiza grupos dentro de cada ciclo académico.",
        category: "Base académica",
    },
    {
        href: "/director/academic/subjects",
        title: "Materias",
        description: "Mantén limpio el catálogo de materias disponibles.",
        category: "Base académica",
    },
    {
        href: "/director/students",
        title: "Alumnos",
        description: "Registra, importa y consulta alumnos con semáforo académico.",
        category: "Operación",
    },
    {
        href: "/director/academic/courses",
        title: "Cursos",
        description: "Relaciona ciclo, grupo, materia y docente.",
        category: "Operación",
    },
    {
        href: "/director/assignments",
        title: "Tutores",
        description: "Asigna docentes como tutores de grupo.",
        category: "Operación",
    },
    {
        href: "/director/referrals",
        title: "Canalizaciones",
        description: "Supervisa casos enviados a Pedagogía o Psicología.",
        category: "Seguimiento",
    },
];

const categories: QuickLink["category"][] = [
    "Base académica",
    "Operación",
    "Seguimiento",
];

export default function DirectorDashboardPage() {
    return (
        <div className="space-y-8">
            <section className="ap-panel p-8">
                <p className="ap-eyebrow">Dashboard</p>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                            Dirección académica
                        </h2>

                        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-soft)]">
                            Administra la estructura base de AulaPulse: usuarios, ciclos
                            automáticos, grupos, materias, alumnos, cursos y tutores. La idea es
                            simple: primero orden académico, luego operación. Radical, casi como
                            pensar antes de hacer clic.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--color-border)] bg-white/70 p-5">
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            Flujo recomendado
                        </p>

                        <ol className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
                            <li>1. Verifica el ciclo activo.</li>
                            <li>2. Crea grupos y materias.</li>
                            <li>3. Registra o importa alumnos.</li>
                            <li>4. Asigna cursos y tutores.</li>
                        </ol>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/director/students" className="ap-button-primary">
                        Gestionar alumnos
                    </Link>

                    <Link href="/director/assignments" className="ap-button-secondary">
                        Asignar tutores
                    </Link>

                    <Link href="/director/referrals" className="ap-button-secondary">
                        Ver canalizaciones
                    </Link>
                </div>
            </section>

            <section className="grid gap-6">
                {categories.map((category) => {
                    const items = quickLinks.filter((item) => item.category === category);

                    return (
                        <div key={category} className="space-y-4">
                            <p className="ap-eyebrow">{category}</p>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="ap-panel p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]"
                                    >
                                        <div className="ap-badge ap-badge-brand">
                                            Acceso rápido
                                        </div>

                                        <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                                            {item.title}
                                        </h3>

                                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                                            {item.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}