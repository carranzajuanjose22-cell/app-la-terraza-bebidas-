import { eq, like, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { products } from "../models/schema.js";

export async function getAllProducts(search = "") {
  if (search) {
    return db.select().from(products).where(
      or(
        like(products.name, `%${search}%`),
        like(products.category, `%${search}%`)
      )
    );
  }
  return db.select().from(products);
}

export async function getProductById(id) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) throw new Error("Producto no encontrado");
  return product;
}

export async function createProduct(data) {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}

export async function updateProduct(id, data) {
  data.updatedAt = new Date().toISOString();
  const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning();
  if (!updated) throw new Error("Producto no encontrado");
  return updated;
}

export async function deleteProduct(id) {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  if (!deleted) throw new Error("Producto no encontrado");
  return { message: "Producto eliminado" };
}
