/**
 * Script de migración para el módulo de suscripción.
 * Crea la tabla subscription_config y el usuario creador.
 *
 * Uso:
 *   node db/apply-subscription-migration.js
 *
 * Variables de entorno opcionales para personalizar la cuenta creadora:
 *   CREATOR_EMAIL    (default: creator@terraza.dev)
 *   CREATOR_PASSWORD (default: cr34t0r!2024)
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const CREATOR_EMAIL    = process.env.CREATOR_EMAIL    || "creator@terraza.dev";
const CREATOR_PASSWORD = process.env.CREATOR_PASSWORD || "cr34t0r!2024";

async function run() {
  console.log("Aplicando migración del módulo de suscripción...\n");

  // 1. Tabla subscription_config
  await client.execute(`
    CREATE TABLE IF NOT EXISTS subscription_config (
      id               INTEGER PRIMARY KEY,
      subscription_day INTEGER,
      next_expiry      TEXT,
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  console.log("✓ Tabla subscription_config lista");

  // 2. Usuario creador (secreto)
  const hashedPw = await bcrypt.hash(CREATOR_PASSWORD, 10);

  // Usamos INSERT OR IGNORE para no duplicar si ya existe
  await client.execute({
    sql: `
      INSERT OR IGNORE INTO users (name, email, password, role, is_active, created_at, updated_at)
      VALUES ('Creador', ?, ?, 'creator', 1, datetime('now'), datetime('now'))
    `,
    args: [CREATOR_EMAIL, hashedPw],
  });
  console.log(`✓ Usuario creador creado/verificado: ${CREATOR_EMAIL}`);
  console.log(`  Contraseña: ${CREATOR_PASSWORD}`);
  console.log("  ⚠️  Cambiá estas credenciales en producción usando las variables de entorno CREATOR_EMAIL y CREATOR_PASSWORD.\n");

  console.log("✅ Migración completada exitosamente.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error en la migración:", err.message);
  process.exit(1);
});
