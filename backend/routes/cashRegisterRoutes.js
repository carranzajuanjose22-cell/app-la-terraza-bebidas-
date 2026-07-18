import { Router } from "express";
import { getStatus, open, close, getClosedRegisters, getClosedRegisterDetail } from "../controllers/cashRegisterController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/status", getStatus);
router.post("/open", requireRole("admin"), open);
router.post("/close", requireRole("admin"), close);
router.get("/closed", getClosedRegisters);
router.get("/closed/:id", getClosedRegisterDetail);

export default router;
