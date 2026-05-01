import { redirectAuthenticatedUserToDefaultRoute } from "@/server/auth/page-access";
import Link from "next/link";


export default async function HomePage() {
  await redirectAuthenticatedUserToDefaultRoute();

  return (
    <main className="ap-auth-shell">
      <div className="ap-auth-grid">
        <section className="ap-auth-brand">
          <div>
            <p className="ap-auth-logo text-blue-200">AulaPulse</p>

            <h1 className="ap-auth-brand-title text-white">
              Gestión académica con estructura, seguimiento y criterio.
            </h1>

            <p className="ap-auth-brand-copy">
              AulaPulse centraliza la operación interna de la institución para
              mantener orden académico, seguimiento oportuno y visibilidad sobre
              usuarios, grupos, cursos y casos de atención.
            </p>
          </div>

          <div>
            <ul className="ap-auth-brand-list">
              <li>
                <span className="ap-auth-brand-dot" />
                <span>Gestión clara por roles y alcance real de operación.</span>
              </li>
              <li>
                <span className="ap-auth-brand-dot" />
                <span>
                  Seguimiento académico y canalización con una sola base visual.
                </span>
              </li>
              <li>
                <span className="ap-auth-brand-dot" />
                <span>
                  Interfaz institucional, moderna y sobria. Un concepto radical:
                  que el sistema se vea como producto real.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="ap-auth-panel">
          <div className="ap-eyebrow">Plataforma interna</div>

          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
            Bienvenido a AulaPulse
          </h2>

          <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
            Accede a la plataforma para continuar con la operación académica y
            el seguimiento institucional.
          </p>

          <div className="ap-panel-muted mt-8 p-5">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Acceso centralizado
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
              Inicia sesión con tu cuenta institucional para entrar a tu módulo
              correspondiente según tus permisos asignados.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="ap-button-primary">
              Ir a iniciar sesión
            </Link>

            <span className="ap-button-secondary cursor-default">
              Plataforma institucional
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}