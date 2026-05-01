"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { RoleCode } from "@/shared/enums/roles";
import {
    getRouteForRoleSwitch,
    getRoleLabel,
} from "@/shared/lib/auth-routing";

type ActiveRoleSwitcherProps = {
    roles: RoleCode[];
    activeRole: RoleCode;
};

export function ActiveRoleSwitcher({
    roles,
    activeRole,
}: ActiveRoleSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [selectedRole, setSelectedRole] = useState<RoleCode>(activeRole);
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setSelectedRole(activeRole);
    }, [activeRole]);

    const availableRoles = useMemo(
        () => [...roles].sort((a, b) => getRoleLabel(a).localeCompare(getRoleLabel(b))),
        [roles],
    );

    async function applyRoleChange(nextRole: RoleCode) {
        if (nextRole === activeRole) {
            return;
        }

        setError("");

        try {
            const response = await fetch("/api/auth/active-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ activeRole: nextRole }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                setError(data?.error ?? "No se pudo cambiar el modo activo.");
                setSelectedRole(activeRole);
                return;
            }

            const nextPath = getRouteForRoleSwitch(pathname, nextRole);

            if (nextPath !== pathname) {
                router.replace(nextPath);
                return;
            }

            router.refresh();
        } catch {
            setError("Error de red al cambiar el modo activo.");
            setSelectedRole(activeRole);
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                Cambiar modo
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
                <select
                    value={selectedRole}
                    onChange={(event) => {
                        const nextRole = event.target.value as RoleCode;
                        setSelectedRole(nextRole);

                        startTransition(() => {
                            void applyRoleChange(nextRole);
                        });
                    }}
                    disabled={isPending}
                    className="min-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-brand-400)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {availableRoles.map((role) => (
                        <option key={role} value={role}>
                            {getRoleLabel(role)}
                        </option>
                    ))}
                </select>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white/70 px-4 py-2.5 text-xs text-[var(--color-text-muted)]">
                    Actual:{" "}
                    <span className="font-semibold text-[var(--color-text)]">
                        {getRoleLabel(activeRole)}
                    </span>
                </div>
            </div>

            {error ? (
                <p className="text-xs text-red-600">{error}</p>
            ) : null}
        </div>
    );
}