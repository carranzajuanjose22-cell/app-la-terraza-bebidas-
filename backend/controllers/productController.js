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
    const { name, price, cost, category, stock, minStock } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Nombre y precio son requeridos" });
    }
    const product = await productService.createProduct({
      name, price: Number(price), cost: Number(cost || 0),
      category: category || "General", stock: Number(stock || 0),
      minStock: Number(minStock || 5),
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
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
