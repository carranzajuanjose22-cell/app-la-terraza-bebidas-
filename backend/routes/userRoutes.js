import { Router } from "express";
import { getUsers, updateUser, deleteUser } from "../controllers/userController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken, requireRole("admin"));

router.get("/", getUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
