import * as subscriptionService from "../services/subscriptionService.js";

export async function getStatus(req, res) {
  try {
    res.json(await subscriptionService.getStatus());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function configure(req, res) {
  try {
    const day = parseInt(req.body.day, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      return res.status(400).json({ message: "Día inválido. Debe ser un número entre 1 y 31." });
    }
    res.json(await subscriptionService.configure(day));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function renew(req, res) {
  try {
    res.json(await subscriptionService.renew());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
