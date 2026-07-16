import { and, asc, eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions, transactionItems, transactionPayments, products, promotionItems, barBottles } from "../models/schema.js";
import { recalcPromotionsForProduct, getDrinkRecipe } from "./productService.js";

async function getAvailableGlassesForBottle(bottleProductId, glassesPerBottle) {
  const openBottles = await db
    .select()
    .from(barBottles)
    .where(and(eq(barBottles.productId, bottleProductId), eq(barBottles.status, "open")));
  return openBottles.reduce(
    (acc, b) => acc + Math.max(0, glassesPerBottle - (b.servedGlasses || 0)),
    0,
  );
}

async function consumeGlassesFromBottles(bottleProductId, glassesPerBottle, quantity, drinkName) {
  const openBottles = await db
    .select()
    .from(barBottles)
    .where(and(eq(barBottles.productId, bottleProductId), eq(barBottles.status, "open")))
    .orderBy(asc(barBottles.createdAt));

  let remaining = quantity;
  for (const bottle of openBottles) {
    if (remaining <= 0) break;
    const room = Math.max(0, glassesPerBottle - (bottle.servedGlasses || 0));
    if (room <= 0) continue;
    const take = Math.min(room, remaining);
    const newServed = (bottle.servedGlasses || 0) + take;
    const isEmpty = newServed >= glassesPerBottle;
    await db
      .update(barBottles)
      .set({ servedGlasses: newServed, status: isEmpty ? "empty" : "open" })
      .where(eq(barBottles.id, bottle.id));
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(`No hay botellas abiertas suficientes para "${drinkName}"`);
  }
}

async function validateDrinkCapacity(product, quantity) {
  const recipe = await getDrinkRecipe(product.id);
  if (recipe.length === 0) return false;

  for (const ing of recipe) {
    const needed = ing.glassesUsed * quantity;
    const available = await getAvailableGlassesForBottle(ing.bottleProductId, ing.glassesPerBottle);
    if (available < needed) {
      const [bottle] = await db.select().from(products).where(eq(products.id, ing.bottleProductId)).limit(1);
      const bottleName = bottle?.name || "botella";
      throw new Error(
        `Sin botellas abiertas suficientes de "${bottleName}" para "${product.name}": ` +
        `hay ${available} porción${available === 1 ? "" : "es"}, se necesitan ${needed}. Abrí otra botella en la barra.`,
      );
    }
  }
  return true;
}

async function consumeDrinkRecipe(product, quantity) {
  const recipe = await getDrinkRecipe(product.id);
  for (const ing of recipe) {
    await consumeGlassesFromBottles(
      ing.bottleProductId,
      ing.glassesPerBottle,
      ing.glassesUsed * quantity,
      product.name,
    );
  }
}

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
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      if (!item.productId) continue;
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product) throw new Error(`Producto no encontrado: ${item.name}`);

      const isDrink = await validateDrinkCapacity(product, item.quantity);
      if (isDrink) continue;

      if (product.isPromotion) {
        const components = await db.select().from(promotionItems).where(eq(promotionItems.promotionId, product.id));
        for (const comp of components) {
          const [compProduct] = await db.select().from(products).where(eq(products.id, comp.productId)).limit(1);
          if (!compProduct) continue;
          const needed = comp.quantity * item.quantity;
          if (compProduct.stock < needed) {
            throw new Error(
              `Stock insuficiente para "${compProduct.name}" (parte de la promoción "${product.name}"): hay ${compProduct.stock} unidad${compProduct.stock === 1 ? "" : "es"}, se necesitan ${needed}`
            );
          }
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para la promoción "${product.name}": hay ${product.stock}, se piden ${item.quantity}`);
        }
      } else {
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}": hay ${product.stock} unidad${product.stock === 1 ? "" : "es"}, se piden ${item.quantity}`);
        }
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

    const affectedComponentIds = new Set();

    for (const item of data.items) {
      if (!item.productId) continue;
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      const recipe = await getDrinkRecipe(item.productId);

      if (recipe.length > 0) {
        await consumeDrinkRecipe(product, item.quantity);
      } else if (product?.isPromotion) {
        const components = await db.select().from(promotionItems).where(eq(promotionItems.promotionId, item.productId));
        for (const comp of components) {
          const deduct = comp.quantity * item.quantity;
          await db
            .update(products)
            .set({ stock: sql`MAX(0, stock - ${deduct})` })
            .where(eq(products.id, comp.productId));
          affectedComponentIds.add(comp.productId);
        }
        await db
          .update(products)
          .set({ stock: sql`MAX(0, stock - ${item.quantity})` })
          .where(eq(products.id, item.productId));
      } else {
        await db
          .update(products)
          .set({ stock: sql`MAX(0, stock - ${item.quantity})` })
          .where(eq(products.id, item.productId));
        affectedComponentIds.add(item.productId);
      }
    }

    for (const productId of affectedComponentIds) {
      await recalcPromotionsForProduct(productId);
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
