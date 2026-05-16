import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const tablesToDrop = [
  "transaction_payments",
  "transaction_items",
  "transactions",
  "cash_registers",
  "fixed_expenses",
  "payment_methods",
  "order_items",
  "payments",
  "orders",
  "tables",
  "products",
  "categories",
  "users",
  "__drizzle_migrations",
];

async function reset() {
  console.log("Eliminando todas las tablas de Turso...");
  await client.execute("PRAGMA foreign_keys = OFF;");

  for (const table of tablesToDrop) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${table}";`);
      console.log(`✓ Tabla "${table}" eliminada`);
    } catch (err) {
      console.log(`  (omitida: ${table} — ${err.message})`);
    }
  }

  await client.execute("PRAGMA foreign_keys = ON;");
  console.log("\nBase de datos limpia. Ahora corré: pnpm run db:generate && pnpm run db:migrate");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
