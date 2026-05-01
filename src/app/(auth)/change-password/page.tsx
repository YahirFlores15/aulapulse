"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getDefaultRouteByRole } from "@/shared/lib/auth-routing";
import type { RoleCode } from "@/shared/enums/roles";

type SessionUser = {
    roles?: RoleCode[];
    activeRole?: RoleCode;
    mustChangePassword?: boolean;
};

export default function ChangePasswordPage() {
    const router = useRouter();

    const [checkingSession, setCheckingSession] = useState(true);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadSession() {
            try {
                const response = await fetch("/api/auth/me", {
                    cache: "no-store",
                });

                const data = await response.json().catch(() => null);
                const user = data?.user as SessionUser | null;

                if (!response.ok || !user) {
                    router.replace("/login");
                    return;
                }

                if (!user.mustChangePassword) {
                    const target = user.activeRole
                        ? getDefaultRouteByRole(user.activeRole)
                        : "/";

                    router.replace(target);
                    return;
                }
            } catch {
                router.replace("/login");
                return;
            } finally {
                setCheckingSession(false);
            }
        }

        void loadSession();
    }, [router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                setError(data?.error ?? "No se pudo actualizar la contraseña.");
                return;
            }

            setMessage(data?.message ?? "Contraseña actualizada correctamente.");

            const user = data?.user as SessionUser | null;
            const target = user?.activeRole
                ? getDefaultRouteByRole(user.activeRole)
                : "/";

            setTimeout(() => {
                router.replace(target);
            }, 700);
        } catch {
            setError("Error de red al actualizar la contraseña.");
        } finally {
            setLoading(false);
        }
    }

    if (checkingSession) {
        return (
            <main className="ap-auth-shell">
                <div className="w-full max-w-xl">
                    <section className="ap-auth-panel">
                        <div className="ap-eyebrow">Verificación</div>

                        <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">
                            Validando sesión
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                            Estamos comprobando que tu cuenta requiera el cambio obligatorio de
                            contraseña.
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="ap-auth-shell">
            <div className="ap-auth-grid">
                <section className="ap-auth-brand">
                    <div>
                        <p className="ap-auth-logo text-blue-200">AulaPulse</p>

                        <h1 className="ap-auth-brand-title">
                            Primer acceso seguro al sistema.
                        </h1>

                        <p className="ap-auth-brand-copy">
                            Antes de continuar a tu módulo debes actualizar tu contraseña
                            temporal para asegurar el acceso institucional.
                        </p>
                    </div>

                    <div>
                        <ul className="ap-auth-brand-list">
                            <li>
                                <span className="ap-auth-brand-dot" />
                                <span>La nueva contraseña debe ser exclusiva para tu cuenta.</span>
                            </li>
                            <li>
                                <span className="ap-auth-brand-dot" />
                                <span>El cambio se aplicará antes de entrar al panel principal.</span>
                            </li>
                            <li>
                                <span className="ap-auth-brand-dot" />
                                <span>
                                    Seguridad básica antes de entrar al sistema. Trámite mínimo,
                                    pero necesario.
                                </span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="ap-auth-panel">
                    <div className="ap-eyebrow">Cambio obligatorio</div>

                    <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                        Actualizar contraseña
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        Debes reemplazar tu contraseña temporal antes de continuar a la
                        plataforma.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="ap-field">
                            <label htmlFor="currentPassword" className="ap-label">
                                Contraseña actual
                            </label>

                            <input
                                id="currentPassword"
                                type="password"
                                className="ap-input"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <div className="ap-field">
                            <label htmlFor="newPassword" className="ap-label">
                                Nueva contraseña
                            </label>

                            <input
                                id="newPassword"
                                type="password"
                                className="ap-input"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="ap-field">
                            <label htmlFor="confirmPassword" className="ap-label">
                                Confirmar nueva contraseña
                            </label>

                            <input
                                id="confirmPassword"
                                type="password"
                                className="ap-input"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />
                        </div>

                        {error ? (
                            <div className="ap-message ap-message-error">{error}</div>
                        ) : null}

                        {message ? (
                            <div className="ap-message ap-message-success">{message}</div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="ap-button-primary w-full"
                        >
                            {loading ? "Guardando..." : "Actualizar contraseña"}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}