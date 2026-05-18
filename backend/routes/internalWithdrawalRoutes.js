import { Router } from "express";
import { getWithdrawals, createWithdrawal } from "../controllers/internalWithdrawalController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/", getWithdrawals);
router.post("/", createWithdrawal);

export default router;