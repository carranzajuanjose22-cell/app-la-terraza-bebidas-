import { db } from "../db/index.js";
import { barBottles, products, drinkBottleItems } from "../models/schema.js";
import { eq, desc, isNotNull } from "drizzle-orm";

export const getBarBottles = async (req, res) => {
  try {
    const bottles = await db
      .select()
      .from(barBottles)
      .where(eq(barBottles.status, "open"))
      .orderBy(desc(barBottles.createdAt));

    // Rendimiento por tipo de botella: preferir drink_bottle_items, luego legacy products
    const drinkItems = await db.select().from(drinkBottleItems);
    const glassesByBottleProductId = new Map();
    for (const dg of drinkItems) {
      if (!glassesByBottleProductId.has(dg.bottleProductId)) {
        glassesByBottleProductId.set(dg.bottleProductId, {
          glassesPerBottle: dg.glassesPerBottle,
          drinkName: null,
        });
      }
    }

    const legacyDrinks = await db
      .select({
        bottleProductId: products.bottleProductId,
        glassesPerBottle: products.glassesPerBottle,
        drinkName: products.name,
      })
      .from(products)
      .where(isNotNull(products.bottleProductId));

    for (const dg of legacyDrinks) {
      if (!glassesByBottleProductId.has(dg.bottleProductId)) {
        glassesByBottleProductId.set(dg.bottleProductId, {
          glassesPerBottle: dg.glassesPerBottle,
          drinkName: dg.drinkName,
        });
      } else if (!glassesByBottleProductId.get(dg.bottleProductId).drinkName) {
        glassesByBottleProductId.get(dg.bottleProductId).drinkName = dg.drinkName;
      }
    }

    // Nombres de tragos que usan cada botella
    const drinkNamesByBottle = new Map();
    for (const dg of drinkItems) {
      const [drink] = await db.select({ name: products.name }).from(products).where(eq(products.id, dg.drinkProductId)).limit(1);
      if (!drink) continue;
      if (!drinkNamesByBottle.has(dg.bottleProductId)) drinkNamesByBottle.set(dg.bottleProductId, []);
      drinkNamesByBottle.get(dg.bottleProductId).push(drink.name);
    }

    const enriched = bottles.map((b) => {
      const info = glassesByBottleProductId.get(b.productId);
      const names = drinkNamesByBottle.get(b.productId) || [];
      return {
        ...b,
        glassesPerBottle: info?.glassesPerBottle ?? null,
        drinkGlassName: names[0] || info?.drinkName || null,
        drinkGlassNames: names,
      };
    });

    res.json(enriched);
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
