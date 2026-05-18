import { Router } from "express";
import { getBarBottles, openBarBottle, emptyBarBottle } from "../controllers/barBottleController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/", getBarBottles);
router.post("/", openBarBottle);
router.patch("/:id/empty", emptyBarBottle);

export default router;