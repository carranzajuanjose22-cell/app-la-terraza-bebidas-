import { eq, like, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, promotionItems, categories, drinkBottleItems } from "../models/schema.js";

// ── Helpers de recálculo de stock de promociones ──────────────────────────────

async function recalcPromotionStock(promotionId) {
  const items = await db.select().from(promotionItems).where(eq(promotionItems.promotionId, promotionId));
  if (items.length === 0) return;

  let minStock = Infinity;
  for (const item of items) {
    const [prod] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!prod) { minStock = 0; break; }
    minStock = Math.min(minStock, Math.floor(prod.stock / item.quantity));
  }

  const newStock = minStock === Infinity ? 0 : minStock;
  await db
    .update(products)
    .set({ stock: newStock, updatedAt: new Date().toISOString() })
    .where(eq(products.id, promotionId));
}

export async function recalcPromotionsForProduct(productId) {
  const affectedPromos = await db
    .select()
    .from(promotionItems)
    .where(eq(promotionItems.productId, productId));
  for (const row of affectedPromos) {
    await recalcPromotionStock(row.promotionId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function normalizeDrinkBottleItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((i) => ({
      bottleProductId: Number(i.bottleProductId),
      glassesUsed: Math.max(1, Number(i.glassesUsed) || 1),
      glassesPerBottle: Number(i.glassesPerBottle) || 0,
    }))
    .filter((i) => i.bottleProductId && i.glassesPerBottle > 0);
}

async function calcDrinkCostFromIngredients(ingredients) {
  let total = 0;
  for (const ing of ingredients) {
    const [bottle] = await db.select().from(products).where(eq(products.id, ing.bottleProductId)).limit(1);
    if (!bottle || ing.glassesPerBottle <= 0) continue;
    total += (Number(bottle.cost) || 0) / ing.glassesPerBottle * ing.glassesUsed;
  }
  return total;
}

async function attachDrinkBottleItems(productList) {
  if (!productList.length) return productList;
  const allItems = await db.select().from(drinkBottleItems);
  const byDrink = new Map();
  for (const row of allItems) {
    if (!byDrink.has(row.drinkProductId)) byDrink.set(row.drinkProductId, []);
    byDrink.get(row.drinkProductId).push({
      id: row.id,
      bottleProductId: row.bottleProductId,
      glassesUsed: row.glassesUsed,
      glassesPerBottle: row.glassesPerBottle,
    });
  }

  return productList.map((p) => {
    const fromTable = byDrink.get(p.id);
    if (fromTable?.length) return { ...p, drinkBottleItems: fromTable };
    // Fallback legacy: un solo bottleProductId en products
    if (p.bottleProductId && p.glassesPerBottle) {
      return {
        ...p,
        drinkBottleItems: [{
          bottleProductId: p.bottleProductId,
          glassesUsed: 1,
          glassesPerBottle: p.glassesPerBottle,
        }],
      };
    }
    return { ...p, drinkBottleItems: [] };
  });
}

export async function getDrinkRecipe(productId) {
  const items = await db.select().from(drinkBottleItems).where(eq(drinkBottleItems.drinkProductId, productId));
  if (items.length > 0) {
    return items.map((i) => ({
      bottleProductId: i.bottleProductId,
      glassesUsed: i.glassesUsed,
      glassesPerBottle: i.glassesPerBottle,
    }));
  }
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (product?.bottleProductId && product.glassesPerBottle) {
    return [{
      bottleProductId: product.bottleProductId,
      glassesUsed: 1,
      glassesPerBottle: product.glassesPerBottle,
    }];
  }
  return [];
}

export async function getAllProducts(search = "") {
  let list;
  if (search) {
    list = await db.select().from(products).where(
      or(
        like(products.name, `%${search}%`),
        like(products.category, `%${search}%`)
      )
    );
  } else {
    list = await db.select().from(products);
  }
  return attachDrinkBottleItems(list);
}

export async function getProductById(id) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) throw new Error("Producto no encontrado");
  const [enriched] = await attachDrinkBottleItems([product]);
  if (product.isPromotion) {
    const items = await db.select().from(promotionItems).where(eq(promotionItems.promotionId, id));
    return { ...enriched, promotionItems: items };
  }
  return enriched;
}

export async function createProduct(data) {
  const { promotionItems: items, drinkBottleItems: rawDrinkItems, ...productData } = data;
  const drinkItems = normalizeDrinkBottleItems(rawDrinkItems);

  if (productData.isPromotion) {
    const existing = await db.select().from(categories).where(eq(categories.name, "Promocion")).limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values({ name: "Promocion", sortOrder: 999 });
    }
  }

  const isDrink = drinkItems.length > 0 || !!productData.bottleProductId;

  if (isDrink) {
    productData.stock = 0;
    productData.minStock = 0;
    if (drinkItems.length > 0) {
      productData.cost = await calcDrinkCostFromIngredients(drinkItems);
      // Mantener columns legacy con la primera botella (compat)
      productData.bottleProductId = drinkItems[0].bottleProductId;
      productData.glassesPerBottle = drinkItems[0].glassesPerBottle;
    } else if (productData.bottleProductId) {
      const [bottle] = await db.select().from(products).where(eq(products.id, productData.bottleProductId)).limit(1);
      const gpb = Number(productData.glassesPerBottle) || 0;
      productData.cost = bottle && gpb > 0 ? (Number(bottle.cost) || 0) / gpb : 0;
    }
  }

  const [product] = await db.insert(products).values(productData).returning();

  if (items && items.length > 0) {
    await db.insert(promotionItems).values(
      items.map((i) => ({ promotionId: product.id, productId: i.productId, quantity: i.quantity }))
    );
  }

  if (drinkItems.length > 0) {
    await db.insert(drinkBottleItems).values(
      drinkItems.map((i) => ({
        drinkProductId: product.id,
        bottleProductId: i.bottleProductId,
        glassesUsed: i.glassesUsed,
        glassesPerBottle: i.glassesPerBottle,
      }))
    );
  } else if (productData.bottleProductId && productData.glassesPerBottle) {
    await db.insert(drinkBottleItems).values({
      drinkProductId: product.id,
      bottleProductId: Number(productData.bottleProductId),
      glassesUsed: 1,
      glassesPerBottle: Number(productData.glassesPerBottle),
    });
  }

  const [enriched] = await attachDrinkBottleItems([product]);
  return enriched;
}

export async function updateProduct(id, data) {
  const { promotionItems: rawPromoItems, drinkBottleItems: rawDrinkItems, ...rest } = data;
  const drinkItems = rawDrinkItems !== undefined ? normalizeDrinkBottleItems(rawDrinkItems) : null;

  const bottleProductId = rest.bottleProductId ? Number(rest.bottleProductId) : null;
  const glassesPerBottle = rest.glassesPerBottle != null && rest.glassesPerBottle !== ""
    ? Number(rest.glassesPerBottle)
    : null;

  const isDrink =
    (drinkItems && drinkItems.length > 0) ||
    (!!bottleProductId && drinkItems === null);

  let cost = Number(rest.cost ?? 0);
  let legacyBottleId = null;
  let legacyGpb = null;

  if (drinkItems && drinkItems.length > 0) {
    cost = await calcDrinkCostFromIngredients(drinkItems);
    legacyBottleId = drinkItems[0].bottleProductId;
    legacyGpb = drinkItems[0].glassesPerBottle;
  } else if (drinkItems && drinkItems.length === 0) {
    // Explicitamente dejó de ser trago
    legacyBottleId = null;
    legacyGpb = null;
  } else if (bottleProductId) {
    const [bottle] = await db.select().from(products).where(eq(products.id, bottleProductId)).limit(1);
    const gpb = glassesPerBottle || 0;
    cost = bottle && gpb > 0 ? (Number(bottle.cost) || 0) / gpb : 0;
    legacyBottleId = bottleProductId;
    legacyGpb = gpb;
  }

  const productData = {
    name:             rest.name,
    price:            Number(rest.price),
    cost,
    category:         rest.category,
    stock:            isDrink ? 0 : Number(rest.stock ?? 0),
    minStock:         isDrink ? 0 : Number(rest.minStock ?? 0),
    icon:             rest.icon ?? "Package",
    isPromotion:      rest.isPromotion ? 1 : 0,
    bottleProductId:  legacyBottleId,
    glassesPerBottle: legacyGpb,
    updatedAt:        new Date().toISOString(),
  };

  const [updated] = await db
    .update(products)
    .set(productData)
    .where(eq(products.id, id))
    .returning();
  if (!updated) throw new Error("Producto no encontrado");

  if (Array.isArray(rawPromoItems)) {
    await db.delete(promotionItems).where(eq(promotionItems.promotionId, id));
    if (rawPromoItems.length > 0) {
      await db.insert(promotionItems).values(
        rawPromoItems.map((i) => ({
          promotionId: id,
          productId: Number(i.productId),
          quantity: Number(i.quantity) || 1,
        }))
      );
    }
  }

  if (drinkItems !== null) {
    await db.delete(drinkBottleItems).where(eq(drinkBottleItems.drinkProductId, id));
    if (drinkItems.length > 0) {
      await db.insert(drinkBottleItems).values(
        drinkItems.map((i) => ({
          drinkProductId: id,
          bottleProductId: i.bottleProductId,
          glassesUsed: i.glassesUsed,
          glassesPerBottle: i.glassesPerBottle,
        }))
      );
    }
  }

  if (!productData.isPromotion) {
    await recalcPromotionsForProduct(id);
  }

  const [enriched] = await attachDrinkBottleItems([updated]);
  return enriched;
}

export async function deleteProduct(id) {
  await db.delete(drinkBottleItems).where(eq(drinkBottleItems.drinkProductId, id));
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  if (!deleted) throw new Error("Producto no encontrado");
  return { message: "Producto eliminado" };
}
