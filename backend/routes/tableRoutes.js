import { Router } from "express";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getOpenAccounts,
  saveOpenAccount,
} from "../controllers/tableController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/accounts", getOpenAccounts);
router.put("/accounts/:tableNumber", saveOpenAccount);

router.get("/", getTables);
router.post("/", createTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable); // admin y cajero: solo mesas > 8 y sin consumo

export default router;
