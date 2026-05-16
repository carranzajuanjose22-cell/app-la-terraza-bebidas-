import * as userService from "../services/userService.js";

export async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateUser(req, res) {
  try {
    const user = await userService.updateUser(Number(req.params.id), req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const result = await userService.deleteUser(Number(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}
