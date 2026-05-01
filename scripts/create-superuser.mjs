import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";


const SQLITE_PATH = process.env.SQLITE_PATH ?? "./data/aulapulse.sqlite";
const resolvedDbPath = path.resolve(process.cwd(), SQLITE_PATH);

const SUPERUSER_EMAIL = "super@aulapulse.local";
const SUPERUSER_PASSWORD = "SuperTemp123";
const FIRST_NAME = "Super";
const LAST_NAME = "Usuario";

const db = new Database(resolvedDbPath);

function main() {
    const existingUser = db
        .prepare(
            `
      SELECT id, email
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
        )
        .get(SUPERUSER_EMAIL);

    if (existingUser) {
        console.log(`Ya existe un usuario con el correo: ${SUPERUSER_EMAIL}`);
        process.exit(0);
    }

    const role = db
        .prepare(
            `
      SELECT id, code
      FROM roles
      WHERE code = 'SUPERUSER'
      LIMIT 1
    `,
        )
        .get();

    if (!role) {
        console.error("No existe el rol SUPERUSER en la tabla roles.");
        process.exit(1);
    }

    const passwordHash = bcrypt.hashSync(SUPERUSER_PASSWORD, 10);

    const insertUser = db.prepare(`
    INSERT INTO users (
      email,
      first_name,
      last_name,
      password_hash,
      is_active,
      must_change_password
    )
    VALUES (?, ?, ?, ?, 1, 1)
  `);

    const insertUserRole = db.prepare(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (?, ?)
  `);

    const transaction = db.transaction(() => {
        const result = insertUser.run(
            SUPERUSER_EMAIL,
            FIRST_NAME,
            LAST_NAME,
            passwordHash,
        );

        const userId = Number(result.lastInsertRowid);

        insertUserRole.run(userId, role.id);

        return userId;
    });

    const createdUserId = transaction();

    console.log("SUPERUSER creado correctamente.");
    console.log(`userId: ${createdUserId}`);
    console.log(`email: ${SUPERUSER_EMAIL}`);
    console.log(`password temporal: ${SUPERUSER_PASSWORD}`);
    console.log("must_change_password: 1");
}

try {
    main();
} catch (error) {
    console.error("Error al crear SUPERUSER:", error);
    process.exit(1);
} finally {
    db.close();
}