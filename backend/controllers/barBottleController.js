import { db } from "../db/index.js";
import { barBottles, products } from "../models/schema.js";
import { eq, desc } from "drizzle-orm";

export const getBarBottles = async (req, res) => {
  try {
    const bottles = await db
      .select()
      .from(barBottles)
      .where(eq(barBottles.status, "open"))
      .orderBy(desc(barBottles.createdAt));
    res.json(bottles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const openBarBottle = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Producto requerido" });

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    if (product.stock <= 0) return res.status(400).json({ message: "Sin stock suficiente para abrir" });

    await db.update(products).set({ stock: product.stock - 1 }).where(eq(products.id, productId));

    const [newBottle] = await db
      .insert(barBottles)
      .values({ productId: product.id, productName: product.name, status: "open" })
      .returning();

    res.status(201).json(newBottle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emptyBarBottle = async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(barBottles).set({ status: "empty" }).where(eq(barBottles.id, id));
    res.json({ message: "Botella vaciada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};