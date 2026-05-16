import { Router } from "express";
import { getAll, create, update, remove } from "../controllers/fixedExpenseController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken, requireRole("admin"));

router.get("/", getAll);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
