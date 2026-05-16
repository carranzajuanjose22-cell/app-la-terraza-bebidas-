import * as service from "../services/transactionService.js";
import * as cashService from "../services/cashRegisterService.js";

export async function getByRegister(req, res) {
  try {
    const txs = await service.getTransactionsByRegister(Number(req.params.registerId));
    res.json(txs);
  } catch (e) { res.status(500).json({ message: e.message }); }
}

export async function create(req, res) {
  try {
    const register = await cashService.getOpenRegister();
    if (!register) return res.status(400).json({ message: "No hay caja abierta" });
    const tx = await service.createTransaction(req.body, req.user.id, register.id);
    res.status(201).json(tx);
  } catch (e) { res.status(400).json({ message: e.message }); }
}
