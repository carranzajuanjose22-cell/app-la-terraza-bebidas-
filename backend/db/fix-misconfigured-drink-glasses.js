/**
 * Desactiva productos tipo "vaso/trago" que tienen stock propio pero NO están
 * configurados como vaso de barra (sin bottle_product_id / drink_bottle_items).
 * Evita venderlos en el POS como si fueran tragos.
 *
 * Uso: node db/fix-misconfigured-drink-glasses.js
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const c = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  // Productos con "vaso" en el nombre, stock > 0, sin vínculo a botella
  const bad = await c.execute(`
    SELECT p.id, p.name, p.stock
    FROM products p
    WHERE p.bottle_product_id IS NULL
      AND p.is_promotion = 0
      AND p.stock > 0
      AND lower(p.name) LIKE '%vaso%'
      AND NOT EXISTS (
        SELECT 1 FROM drink_bottle_items d WHERE d.drink_product_id = p.id
      )
  `);

  console.log("Productos 'vaso' mal configurados (stock propio, sin botella de barra):");
  for (const row of bad.rows) {
    console.log(`  #${row.id} "${row.name}" stock=${row.stock}`);
  }

  if (bad.rows.length === 0) {
    console.log("Nada que corregir.");
    process.exit(0);
  }

  // Caso especial: si existe un "vaso de fernet" bien configurado y otro mal,
  // desactivar el mal configurado.
  for (const row of bad.rows) {
    await c.execute({
      sql: "UPDATE products SET is_available = 0, updated_at = datetime('now') WHERE id = ?",
      args: [row.id],
    });
    console.log(`  → desactivado #${row.id} (is_available=0). Reconfiguralo en Inventario como trago o borrarlo.`);
  }

  console.log("\nListo. En el POS solo deberían verse los vasos bien configurados.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
