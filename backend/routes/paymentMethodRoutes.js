import { Router } from "express";
import { getAll, create, update, remove } from "../controllers/paymentMethodController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/", getAll);
router.post("/", requireRole("admin"), create);
router.put("/:id", requireRole("admin"), update);
router.delete("/:id", requireRole("admin"), remove);

export default router;
