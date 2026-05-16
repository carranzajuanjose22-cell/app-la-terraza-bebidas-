import { Router } from "express";
import { login, register, getProfile } from "../controllers/authController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", authenticateToken, requireRole("admin"), register);
router.get("/profile", authenticateToken, getProfile);

export default router;
