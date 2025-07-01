import { Router } from "express";
import { getStats } from "../controllers/aiStatsController.js";

const router = Router();
router.get("/", getStats);
export default router;
