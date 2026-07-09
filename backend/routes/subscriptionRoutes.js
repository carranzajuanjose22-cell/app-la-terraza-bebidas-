import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { getStatus, configure, renew } from "../controllers/subscriptionController.js";

const router = Router();

// Cualquier usuario autenticado puede consultar el estado
router.get("/status", authenticateToken, getStatus);

// Solo el creator puede configurar y reactivar
router.post("/configure", authenticateToken, requireRole("creator"), configure);
router.post("/renew",     authenticateToken, requireRole("creator"), renew);

export default router;
