import * as productService from "../services/productService.js";

export async function getProducts(req, res) {
  try {
    const products = await productService.getAllProducts(req.query.search || "");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await productService.getProductById(Number(req.params.id));
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const {
      name, price, cost, category, stock, minStock, icon,
      isPromotion, promotionItems, bottleProductId, glassesPerBottle, drinkBottleItems,
    } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Nombre y precio son requeridos" });
    }

    const ingredients = Array.isArray(drinkBottleItems) ? drinkBottleItems : [];
    const isDrinkGlass = ingredients.length > 0 || !!bottleProductId;

    if (isDrinkGlass) {
      if (isPromotion) {
        return res.status(400).json({ message: "Un producto no puede ser al mismo tiempo promoción y vaso de trago" });
      }
      if (ingredients.length > 0) {
        for (const ing of ingredients) {
          if (!ing.bottleProductId || !ing.glassesPerBottle || Number(ing.glassesPerBottle) <= 0) {
            return res.status(400).json({ message: "Cada botella del trago necesita rendimiento (vasos por botella) válido" });
          }
          if (!ing.glassesUsed || Number(ing.glassesUsed) <= 0) {
            return res.status(400).json({ message: "Indicá cuánto usa el trago de cada botella (mayor a 0)" });
          }
        }
      } else if (!glassesPerBottle || Number(glassesPerBottle) <= 0) {
        return res.status(400).json({ message: "Un vaso de trago requiere indicar cuántos vasos rinde la botella" });
      }
    }

    const product = await productService.createProduct({
      name,
      price: Number(price),
      cost: Number(cost || 0),
      category: isPromotion ? "Promocion" : (category || "General"),
      stock: Number(stock || 0),
      minStock: Number(minStock || 5),
      icon: isPromotion ? "Layers" : (icon || "Package"),
      isPromotion: !!isPromotion,
      promotionItems: Array.isArray(promotionItems) ? promotionItems : [],
      bottleProductId: bottleProductId ? Number(bottleProductId) : null,
      glassesPerBottle: glassesPerBottle ? Number(glassesPerBottle) : null,
      drinkBottleItems: ingredients,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { bottleProductId, glassesPerBottle, isPromotion, drinkBottleItems } = req.body;
    const ingredients = Array.isArray(drinkBottleItems) ? drinkBottleItems : null;
    const isDrinkGlass = (ingredients && ingredients.length > 0) || !!bottleProductId;

    if (isDrinkGlass) {
      if (isPromotion) {
        return res.status(400).json({ message: "Un producto no puede ser al mismo tiempo promoción y vaso de trago" });
      }
      if (ingredients && ingredients.length > 0) {
        for (const ing of ingredients) {
          if (!ing.bottleProductId || !ing.glassesPerBottle || Number(ing.glassesPerBottle) <= 0) {
            return res.status(400).json({ message: "Cada botella del trago necesita rendimiento (vasos por botella) válido" });
          }
          if (!ing.glassesUsed || Number(ing.glassesUsed) <= 0) {
            return res.status(400).json({ message: "Indicá cuánto usa el trago de cada botella (mayor a 0)" });
          }
        }
      } else if (bottleProductId && (!glassesPerBottle || Number(glassesPerBottle) <= 0)) {
        return res.status(400).json({ message: "Un vaso de trago requiere indicar cuántos vasos rinde la botella" });
      }
    }

    const product = await productService.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const result = await productService.deleteProduct(Number(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}
