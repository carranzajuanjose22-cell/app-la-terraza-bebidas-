// Script one-shot: aplica solo las columnas nuevas de la feature "vasos de trago"
// (migracion 0004) directamente contra la DB, sin usar el migrator de drizzle
// (porque esta DB no tiene la tabla __drizzle_migrations y el migrator intentaria
// aplicar todo desde 0000).
//
// Idempotente: si una columna ya existe, ignora el error y continua.
// Uso: node db/apply-drink-glasses-migration.js
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  {
    sql: "ALTER TABLE bar_bottles ADD COLUMN served_glasses INTEGER NOT NULL DEFAULT 0",
    desc: "bar_bottles.served_glasses",
  },
  {
    sql: "ALTER TABLE products ADD COLUMN bottle_product_id INTEGER REFERENCES products(id)",
    desc: "products.bottle_product_id",
  },
  {
    sql: "ALTER TABLE products ADD COLUMN glasses_per_bottle INTEGER",
    desc: "products.glasses_per_bottle",
  },
];

async function run() {
  console.log("Aplicando columnas nuevas para 'vasos de trago'...\n");

  for (const { sql, desc } of statements) {
    try {
      await client.execute(sql);
      console.log(`  [OK]    ${desc}`);
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (msg.includes("duplicate column name")) {
        console.log(`  [SKIP]  ${desc} (ya existe)`);
      } else {
        console.error(`  [FAIL]  ${desc}: ${msg}`);
        process.exit(1);
      }
    }
  }

  console.log("\nListo.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
