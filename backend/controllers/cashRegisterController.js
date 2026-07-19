import * as service from "../services/cashRegisterService.js";

export async function getStatus(req, res) {
  try {
    const register = await service.getOpenRegister();

    if (register) {
      // Totales en vivo (aún no persistidos hasta el cierre) para estadísticas del día
      const totals = await service.computeRegisterTotals(register.id);
      return res.json({ isOpen: true, register: { ...register, ...totals } });
    }

    res.json({ isOpen: false, register: null });
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
    // Lista liviana: los totales ya están en cash_registers. El detalle (productos,
    // recargos, gastos) se pide bajo demanda en GET /closed/:id.
    const registers = await service.getClosedRegisters(req.query.date || null);
    res.json(registers);
  } catch (e) { res.status(500).json({ message: e.message }); }
}

export async function getClosedRegisterDetail(req, res) {
  try {
    const detail = await service.getRegisterWithItems(Number(req.params.id));
    if (detail.status !== "closed") {
      return res.status(400).json({ message: "La caja no está cerrada" });
    }
    res.json(detail);
  } catch (e) { res.status(404).json({ message: e.message }); }
}
