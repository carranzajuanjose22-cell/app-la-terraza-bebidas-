import { db } from "../db/index.js";
import { internalWithdrawals, products, users } from "../models/schema.js";
import { eq, desc } from "drizzle-orm";

export const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await db.select().from(internalWithdrawals).orderBy(desc(internalWithdrawals.createdAt));
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWithdrawal = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let userId = req.user?.id;

    if (!userId) {
      const [firstUser] = await db.select().from(users).limit(1);
      userId = firstUser?.id || null;
    }

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    if (product.stock < quantity) return res.status(400).json({ message: "Stock insuficiente" });

    await db.update(products).set({ stock: product.stock - quantity }).where(eq(products.id, productId));

    const [newWithdrawal] = await db.insert(internalWithdrawals).values({ userId, productId: product.id, productName: product.name, quantity, cost: product.cost * quantity }).returning();

    res.status(201).json(newWithdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};