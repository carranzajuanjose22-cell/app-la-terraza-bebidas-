import { Router } from "express";
import { createDailyExpense, getDailyExpenses } from "../controllers/dailyExpenseController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.post("/", createDailyExpense);
router.get("/", getDailyExpenses);

export default router;