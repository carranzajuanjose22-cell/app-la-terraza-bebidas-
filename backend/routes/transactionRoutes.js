import { Router } from "express";
import { getByRegister, create } from "../controllers/transactionController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/register/:registerId", getByRegister);
router.post("/", create);

export default router;
