// Tabla open_table_accounts para persistir cuentas de mesa.
// Uso: node db/apply-open-table-accounts-migration.js
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Aplicando migración open_table_accounts...\n");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS open_table_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      table_number INTEGER NOT NULL UNIQUE,
      items_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  console.log("  [OK]    open_table_accounts");
  console.log("\nListo.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
