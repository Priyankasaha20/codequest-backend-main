import { Router } from "express";
import {
  startSession,
  submitAnswer,
  completeSession,
} from "../controllers/sessionsController.js";


const router = Router();
router.post("/", auth, startSession);
router.post("/:id/answer", submitAnswer);
router.post("/:id/complete", completeSession);
export default router;
