import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../models/schema.js";

export async function getAllCategories() {
  return db.select().from(categories).where(eq(categories.isActive, true));
}

export async function createCategory(data) {
  const [cat] = await db.insert(categories).values(data).returning();
  return cat;
}

export async function updateCategory(id, name) {
  const [updated] = await db
    .update(categories)
    .set({ name })
    .where(eq(categories.id, id))
    .returning();
  if (!updated) throw new Error("Categoría no encontrada");
  return updated;
}

export async function deleteCategory(id) {
  const [deleted] = await db
    .update(categories)
    .set({ isActive: false })
    .where(eq(categories.id, id))
    .returning();
  if (!deleted) throw new Error("Categoría no encontrada");
  return { message: "Categoría eliminada" };
}
