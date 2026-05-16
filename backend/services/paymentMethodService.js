import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { paymentMethods } from "../models/schema.js";

export async function getAll() {
  return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
}

export async function create(data) {
  const [method] = await db.insert(paymentMethods).values(data).returning();
  return method;
}

export async function update(id, data) {
  const [updated] = await db.update(paymentMethods).set(data).where(eq(paymentMethods.id, id)).returning();
  if (!updated) throw new Error("Método de pago no encontrado");
  return updated;
}

export async function remove(id) {
  const [deleted] = await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).returning();
  if (!deleted) throw new Error("Método de pago no encontrado");
  return { message: "Método de pago eliminado" };
}
