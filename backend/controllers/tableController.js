import * as tableService from "../services/tableService.js";

export async function getTables(req, res) {
  try {
    res.json(await tableService.getAllTables());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createTable(req, res) {
  try {
    const { name } = req.body || {};
    res.status(201).json(await tableService.createTable({ name }));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateTable(req, res) {
  try {
    const { status, isActive, name } = req.body;
    if (isActive !== undefined && req.user.role !== "admin") {
      return res.status(403).json({ message: "Sin permisos suficientes" });
    }
    res.json(await tableService.updateTable(Number(req.params.id), { status, isActive, name }));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteTable(req, res) {
  try {
    res.json(await tableService.deleteTable(Number(req.params.id)));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getOpenAccounts(req, res) {
  try {
    res.json(await tableService.getAllOpenAccounts());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function saveOpenAccount(req, res) {
  try {
    const tableNumber = Number(req.params.tableNumber);
    const { items } = req.body || {};
    res.json(await tableService.saveOpenAccount(tableNumber, items));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
