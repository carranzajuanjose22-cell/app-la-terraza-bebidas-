import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index.js";
import { users, categories, paymentMethods } from "../models/schema.js";

const seedUsers = [
  { name: "Administrador", email: "admin@terraza.com", password: "admin123", role: "admin" },
  { name: "Cajero Demo", email: "cajero@terraza.com", password: "caja123", role: "cajero" },
];

const seedCategories = [
  { name: "Vinos", sortOrder: 1 },
  { name: "Cervezas", sortOrder: 2 },
  { name: "Espirituosas", sortOrder: 3 },
  { name: "Sin Alcohol", sortOrder: 4 },
];

const seedPaymentMethods = [
  { name: "efectivo", surcharge: 0 },
  { name: "transferencia", surcharge: 0 },
  { name: "Mercado Pago", surcharge: 4 },
  { name: "Tarjeta de Crédito", surcharge: 8 },
];

async function seed() {
  console.log("Insertando datos iniciales...");

  for (const user of seedUsers) {
    const hashed = await bcrypt.hash(user.password, 10);
    await db.insert(users).values({ ...user, password: hashed }).onConflictDoNothing();
    console.log(`✓ ${user.role}: ${user.email} / ${user.password}`);
  }

  for (const cat of seedCategories) {
    await db.insert(categories).values(cat).onConflictDoNothing();
    console.log(`✓ Categoría: ${cat.name}`);
  }

  for (const method of seedPaymentMethods) {
    await db.insert(paymentMethods).values(method).onConflictDoNothing();
    console.log(`✓ Método de pago: ${method.name}`);
  }

  console.log("\nSeed completado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
