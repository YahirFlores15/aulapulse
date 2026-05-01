import { getDb } from "./connection";


type SqlParams = Record<string, unknown> | unknown[] | undefined;

export function query<T = unknown>(sql: string, params?: SqlParams): T[] {
    const db = getDb();
    const stmt = db.prepare(sql);

    if (Array.isArray(params)) {
        return stmt.all(...params) as T[];
    }

    return stmt.all(params ?? {}) as T[];
}

export function queryOne<T = unknown>(sql: string, params?: SqlParams): T | null {
    const db = getDb();
    const stmt = db.prepare(sql);

    if (Array.isArray(params)) {
        return (stmt.get(...params) as T | undefined) ?? null;
    }

    return (stmt.get(params ?? {}) as T | undefined) ?? null;
}

export function execute(sql: string, params?: SqlParams) {
    const db = getDb();
    const stmt = db.prepare(sql);

    if (Array.isArray(params)) {
        return stmt.run(...params);
    }

    return stmt.run(params ?? {});
}

export function transaction<T>(callback: () => T): T {
    const db = getDb();
    const wrapped = db.transaction(callback);
    return wrapped();
}