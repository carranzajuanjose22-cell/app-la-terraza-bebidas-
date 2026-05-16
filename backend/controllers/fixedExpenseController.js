import * as service from "../services/fixedExpenseService.js";

export async function getAll(req, res) {
  try { res.json(await service.getAll()); }
  catch (e) { res.status(500).json({ message: e.message }); }
}

export async function create(req, res) {
  try {
    const { name, amount } = req.body;
    if (!name) return res.status(400).json({ message: "Nombre requerido" });
    res.status(201).json(await service.create({ name, amount: Number(amount || 0) }));
  } catch (e) { res.status(400).json({ message: e.message }); }
}

export async function update(req, res) {
  try { res.json(await service.update(Number(req.params.id), req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
}

export async function remove(req, res) {
  try { res.json(await service.remove(Number(req.params.id))); }
  catch (e) { res.status(404).json({ message: e.message }); }
}
