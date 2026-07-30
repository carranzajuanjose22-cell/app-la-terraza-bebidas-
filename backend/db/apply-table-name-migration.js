// Agrega columna name a tables. Idempotente.
// Uso: node db/apply-table-name-migration.js
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function columnExists(table, column) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  return info.rows.some((r) => r.name === column);
}

async function run() {
  console.log("Aplicando migración nombre de mesas...\n");

  if (!(await columnExists("tables", "name"))) {
    await client.execute(`ALTER TABLE tables ADD COLUMN name TEXT NOT NULL DEFAULT ''`);
    console.log("  [OK]    tables.name");
  } else {
    console.log("  [SKIP]  tables.name ya existe");
  }

  await client.execute(`
    UPDATE tables
    SET name = 'Mesa ' || number
    WHERE name IS NULL OR name = ''
  `);
  console.log("  [OK]    backfill nombres vacíos");

  console.log("\nListo.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
