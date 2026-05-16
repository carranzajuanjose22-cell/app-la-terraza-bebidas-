import * as categoryService from "../services/categoryService.js";

export async function getCategories(req, res) {
  try {
    res.json(await categoryService.getAllCategories());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, sortOrder } = req.body;
    if (!name) return res.status(400).json({ message: "Nombre requerido" });
    res.status(201).json(await categoryService.createCategory({ name, sortOrder }));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nombre requerido" });
    res.json(await categoryService.updateCategory(Number(req.params.id), name));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    res.json(await categoryService.deleteCategory(Number(req.params.id)));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}
