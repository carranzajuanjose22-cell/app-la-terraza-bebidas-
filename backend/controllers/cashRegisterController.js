import * as service from "../services/cashRegisterService.js";

export async function getStatus(req, res) {
  try {
    const register = await service.getOpenRegister();
    res.json({ isOpen: !!register, register: register || null });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

export async function open(req, res) {
  try {
    const { initialCash } = req.body;
    const register = await service.openRegister(req.user.id, Number(initialCash || 0));
    res.status(201).json(register);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

export async function close(req, res) {
  try {
    const { registerId } = req.body;
    const register = await service.closeRegister(Number(registerId));
    res.json(register);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

export async function getClosedRegisters(req, res) {
  try {
    const registers = await service.getClosedRegisters(req.query.date || null);
    const withItems = await Promise.all(registers.map((r) => service.getRegisterWithItems(r.id)));
    res.json(withItems);
  } catch (e) { res.status(500).json({ message: e.message }); }
}
