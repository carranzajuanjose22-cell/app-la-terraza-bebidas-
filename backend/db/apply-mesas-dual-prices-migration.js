// Script one-shot: precios duales + mesas + metadatos de venta.
// Idempotente. Uso: node db/apply-mesas-dual-prices-migration.js
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

async function addColumnIfMissing(table, column, ddl) {
  if (await columnExists(table, column)) {
    console.log(`  [SKIP]  ${table}.${column} ya existe`);
    return;
  }
  await client.execute(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  console.log(`  [OK]    ${table}.${column}`);
}

async function run() {
  console.log("Aplicando migración mesas + precios duales...\n");

  await addColumnIfMissing("products", "price_mesa", "price_mesa REAL NOT NULL DEFAULT 0");
  await addColumnIfMissing("products", "price_mostrador", "price_mostrador REAL NOT NULL DEFAULT 0");

  // Backfill: copiar price actual a ambos precios duales donde estén en 0
  try {
    await client.execute(`
      UPDATE products
      SET price_mesa = price,
          price_mostrador = price
      WHERE (price_mesa = 0 AND price_mostrador = 0)
         OR (price_mesa IS NULL OR price_mostrador IS NULL)
    `);
    // También sincronizar filas donde price_mostrador quedó 0 pero price > 0
    await client.execute(`
      UPDATE products
      SET price_mostrador = price
      WHERE price_mostrador = 0 AND price > 0
    `);
    await client.execute(`
      UPDATE products
      SET price_mesa = price
      WHERE price_mesa = 0 AND price > 0
    `);
    console.log("  [OK]    backfill price_mesa / price_mostrador desde price");
  } catch (err) {
    console.error("  [FAIL]  backfill precios:", err.message);
    process.exit(1);
  }

  await addColumnIfMissing("transactions", "sale_type", "sale_type TEXT NOT NULL DEFAULT 'mostrador'");
  await addColumnIfMissing("transactions", "table_number", "table_number INTEGER");
  await addColumnIfMissing("transactions", "code", "code TEXT");

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        number INTEGER NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'libre',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log("  [OK]    tables");
  } catch (err) {
    console.error("  [FAIL]  tables:", err.message);
    process.exit(1);
  }

  console.log("\nListo.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
