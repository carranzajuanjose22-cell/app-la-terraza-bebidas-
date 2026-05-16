import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function runMigrations() {
  console.log("Ejecutando migraciones...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migraciones completadas.");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Error en migraciones:", err);
  process.exit(1);
});
