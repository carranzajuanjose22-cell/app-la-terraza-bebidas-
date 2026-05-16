import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { fixedExpenses } from "../models/schema.js";

export async function getAll() {
  return db.select().from(fixedExpenses);
}

export async function create(data) {
  const [expense] = await db.insert(fixedExpenses).values(data).returning();
  return expense;
}

export async function update(id, data) {
  data.updatedAt = new Date().toISOString();
  const [updated] = await db.update(fixedExpenses).set(data).where(eq(fixedExpenses.id, id)).returning();
  if (!updated) throw new Error("Gasto no encontrado");
  return updated;
}

export async function remove(id) {
  const [deleted] = await db.delete(fixedExpenses).where(eq(fixedExpenses.id, id)).returning();
  if (!deleted) throw new Error("Gasto no encontrado");
  return { message: "Gasto eliminado" };
}
