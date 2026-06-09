import { eq, like, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, promotionItems, categories } from "../models/schema.js";

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

// Recalcula el stock de todas las promos que contengan este producto como componente
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
  if (product.isPromotion) {
    const items = await db.select().from(promotionItems).where(eq(promotionItems.promotionId, id));
    return { ...product, promotionItems: items };
  }
  return product;
}

export async function createProduct(data) {
  const { promotionItems: items, ...productData } = data;

  // Si es una promoción, asegurar que la categoría "Promocion" exista
  if (productData.isPromotion) {
    const existing = await db.select().from(categories).where(eq(categories.name, "Promocion")).limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values({ name: "Promocion", sortOrder: 999 });
    }
  }

  const [product] = await db.insert(products).values(productData).returning();

  if (items && items.length > 0) {
    await db.insert(promotionItems).values(
      items.map((i) => ({ promotionId: product.id, productId: i.productId, quantity: i.quantity }))
    );
  }

  return product;
}

export async function updateProduct(id, data) {
  // Separar promotionItems del resto de campos del producto
  const { promotionItems: rawPromoItems, ...rest } = data;

  // Solo pasar campos que existen en la tabla products
  const productData = {
    name:        rest.name,
    price:       Number(rest.price),
    cost:        Number(rest.cost ?? 0),
    category:    rest.category,
    stock:       Number(rest.stock ?? 0),
    minStock:    Number(rest.minStock ?? 0),
    icon:        rest.icon ?? "Package",
    isPromotion: rest.isPromotion ? 1 : 0,
    updatedAt:   new Date().toISOString(),
  };

  console.log(`[updateProduct] id=${id} isPromotion=${productData.isPromotion} promoItems recibidos:`, rawPromoItems);

  const [updated] = await db
    .update(products)
    .set(productData)
    .where(eq(products.id, id))
    .returning();
  if (!updated) throw new Error("Producto no encontrado");

  // Actualizar items de la promoción si vienen en el payload
  if (Array.isArray(rawPromoItems)) {
    console.log(`[updateProduct] Actualizando ${rawPromoItems.length} items de la promo ${id}`);
    await db.delete(promotionItems).where(eq(promotionItems.promotionId, id));
    if (rawPromoItems.length > 0) {
      const values = rawPromoItems.map((i) => ({
        promotionId: id,
        productId:   Number(i.productId),
        quantity:    Number(i.quantity) || 1,
      }));
      console.log(`[updateProduct] Insertando items:`, values);
      await db.insert(promotionItems).values(values);
    }
    console.log(`[updateProduct] Items actualizados OK`);
  }

  // Si se actualizó un componente (no una promo), recalcular el stock de las promos que lo usen
  if (!productData.isPromotion) {
    await recalcPromotionsForProduct(id);
  }

  return updated;
}

export async function deleteProduct(id) {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  if (!deleted) throw new Error("Producto no encontrado");
  return { message: "Producto eliminado" };
}
