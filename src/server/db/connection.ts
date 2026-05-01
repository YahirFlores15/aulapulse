import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";


declare global {
    // eslint-disable-next-line no-var
    var __aulapulseDb__: Database.Database | undefined;
}

function resolveSqlitePath() {
    const configuredPath = process.env.SQLITE_PATH ?? "./data/aulapulse.sqlite";
    return path.isAbsolute(configuredPath)
        ? configuredPath
        : path.join(process.cwd(), configuredPath);
}

export function getDb() {
    if (global.__aulapulseDb__) {
        return global.__aulapulseDb__;
    }

    const sqlitePath = resolveSqlitePath();
    const dir = path.dirname(sqlitePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(sqlitePath);
    db.pragma("foreign_keys = ON");

    global.__aulapulseDb__ = db;
    return db;
}