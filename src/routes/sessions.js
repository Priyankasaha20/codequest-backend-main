import { Router } from "express";
import {
  startSession,
  submitTextAnswer,
  completeSession,
  getUserSessions,
  getResults,
} from "../controllers/sessionsController.js";
import { isAuth } from "../middleware/auth.js";

const router = Router();

// Fetch all sessions for the logged-in user
router.get("/", isAuth, getUserSessions);

// Kick off a new interview session
router.post("/start", isAuth, startSession);

// Submit text answer for a question (Option A: client-side STT)
router.post("/:sessionId/answer", isAuth, submitTextAnswer);

// Complete the session: score + feedback + summary
router.post("/:sessionId/complete", isAuth, completeSession);

// Get full results for a completed session
router.get("/:sessionId/results", isAuth, getResults);

export default router;