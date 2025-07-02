import { Router } from "express";
import {
  startSession,
  submitAnswer,
  completeSession,
  getUserSessions,
} from "../controllers/sessionsController.js";

const router = Router();

// Get user sessions
router.get("/", getUserSessions);

// Start new session
router.post("/", startSession);

// Submit answer to question
router.post("/:id/answer", submitAnswer);

// Complete session
router.post("/:id/complete", completeSession);

export default router;
