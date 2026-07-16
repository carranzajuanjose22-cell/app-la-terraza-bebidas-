// Script one-shot: tabla drink_bottle_items para tragos multi-botella.
// Idempotente. Uso: node db/apply-drink-multi-bottles-migration.js
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Aplicando migración tragos multi-botella...\n");

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS drink_bottle_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        drink_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        bottle_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        glasses_used INTEGER NOT NULL DEFAULT 1,
        glasses_per_bottle INTEGER NOT NULL
      )
    `);
    console.log("  [OK]    drink_bottle_items");
  } catch (err) {
    console.error("  [FAIL]  drink_bottle_items:", err.message);
    process.exit(1);
  }

  // Migrar productos legacy (bottle_product_id) a drink_bottle_items si aún no tienen filas
  try {
    const legacy = await client.execute(`
      SELECT id, bottle_product_id, glasses_per_bottle
      FROM products
      WHERE bottle_product_id IS NOT NULL
        AND glasses_per_bottle IS NOT NULL
        AND glasses_per_bottle > 0
    `);

    let migrated = 0;
    for (const row of legacy.rows) {
      const drinkId = row.id;
      const bottleId = row.bottle_product_id;
      const gpb = row.glasses_per_bottle;
      const existing = await client.execute({
        sql: "SELECT id FROM drink_bottle_items WHERE drink_product_id = ? LIMIT 1",
        args: [drinkId],
      });
      if (existing.rows.length > 0) continue;
      await client.execute({
        sql: `INSERT INTO drink_bottle_items (drink_product_id, bottle_product_id, glasses_used, glasses_per_bottle)
              VALUES (?, ?, 1, ?)`,
        args: [drinkId, bottleId, gpb],
      });
      migrated++;
    }
    console.log(`  [OK]    migrados ${migrated} vasos legacy → drink_bottle_items`);
  } catch (err) {
    console.error("  [FAIL]  migración legacy:", err.message);
    process.exit(1);
  }

  console.log("\nListo.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
