import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions, transactionItems, transactionPayments, products } from "../models/schema.js";

export async function getTransactionsByRegister(cashRegisterId) {
  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.cashRegisterId, cashRegisterId))
    .orderBy(desc(transactions.createdAt));

  const result = [];
  for (const tx of txs) {
    const items = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, tx.id));
    const payments = await db
      .select()
      .from(transactionPayments)
      .where(eq(transactionPayments.transactionId, tx.id));
    result.push({ ...tx, items, payments });
  }
  return result;
}

export async function createTransaction(data, userId, cashRegisterId) {
  // Validar stock disponible antes de procesar
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      if (!item.productId) continue;
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product) throw new Error(`Producto no encontrado: ${item.name}`);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.name}": hay ${product.stock} unidad${product.stock === 1 ? "" : "es"}, se piden ${item.quantity}`);
      }
    }
  }

  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [tx] = await db
    .insert(transactions)
    .values({ userId, cashRegisterId, total: data.total, date, time })
    .returning();

  if (data.items && data.items.length > 0) {
    await db.insert(transactionItems).values(
      data.items.map((item) => ({
        transactionId: tx.id,
        productId: item.productId || null,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.total,
      }))
    );

    // Descontar stock de cada producto vendido
    for (const item of data.items) {
      if (item.productId) {
        await db
          .update(products)
          .set({ stock: sql`MAX(0, stock - ${item.quantity})` })
          .where(eq(products.id, item.productId));
      }
    }
  }

  if (data.payments && data.payments.length > 0) {
    await db.insert(transactionPayments).values(
      data.payments.map((p) => ({
        transactionId: tx.id,
        methodName: p.type,
        amount: p.amount,
        baseAmount: p.baseAmount ?? p.amount,
        surchargePercent: p.surchargePercent ?? 0,
      }))
    );
  }

  const items = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, tx.id));
  const payments = await db.select().from(transactionPayments).where(eq(transactionPayments.transactionId, tx.id));

  return { ...tx, items, payments };
}
