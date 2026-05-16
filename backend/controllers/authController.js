import * as authService from "../services/authService.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son requeridos" });
    }
    const user = await authService.registerUser({ name, email, password, role });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}
