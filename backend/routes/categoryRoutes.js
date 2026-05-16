import { Router } from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/", getCategories);
router.post("/", requireRole("admin"), createCategory);
router.put("/:id", requireRole("admin"), updateCategory);
router.delete("/:id", requireRole("admin"), deleteCategory);

export default router;
