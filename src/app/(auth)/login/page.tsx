"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getDefaultRouteByRole } from "@/shared/lib/auth-routing";
import type { RoleCode } from "@/shared/enums/roles";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                setError(data?.error ?? "No se pudo iniciar sesión");
                return;
            }

            if (data?.user?.mustChangePassword) {
                router.push("/change-password");
                return;
            }

            const activeRole = data?.user?.activeRole as RoleCode | undefined;

            if (!activeRole) {
                setError("No se pudo resolver el modo activo de la sesión.");
                return;
            }

            router.push(getDefaultRouteByRole(activeRole));
        } catch {
            setError("Error de red al iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="ap-auth-shell">
            <div className="ap-auth-grid">
                <section className="ap-auth-brand">
                    <div>
                        <p className="ap-auth-logo text-blue-200">AulaPulse</p>

                        <h1 className="ap-auth-brand-title text-white">
                            Plataforma interna de gestión y seguimiento académico.
                        </h1>

                        <p className="ap-auth-brand-copy">
                            Accede con tu cuenta institucional para entrar al módulo
                            correspondiente según tu modo activo dentro del sistema.
                        </p>
                    </div>

                    <div>
                        <ul className="ap-auth-brand-list">
                            <li>
                                <span className="ap-auth-brand-dot" />
                                <span>Acceso por rol y alcance controlado por módulo.</span>
                            </li>
                            <li>
                                <span className="ap-auth-brand-dot" />
                                <span>Seguimiento académico y de canalización centralizado.</span>
                            </li>
                            <li>
                                <span className="ap-auth-brand-dot" />
                                <span>
                                    Interfaz institucional, clara y sobria. Qué concepto tan raro
                                    en software escolar.
                                </span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="ap-auth-panel">
                    <div className="ap-eyebrow">Acceso institucional</div>

                    <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                        Iniciar sesión
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        Ingresa tus credenciales para continuar a tu panel de trabajo.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="ap-field">
                            <label htmlFor="email" className="ap-label">
                                Correo institucional
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="ap-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="director@aulapulse.local"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label htmlFor="password" className="ap-label">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="ap-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingresa tu contraseña"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error ? (
                            <div className="ap-message ap-message-error">{error}</div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="ap-button-primary w-full"
                        >
                            {loading ? "Entrando..." : "Entrar al sistema"}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}