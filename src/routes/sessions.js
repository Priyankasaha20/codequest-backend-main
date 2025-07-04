import { Router } from "express";
import {
  startSession,
  submitAnswer,
  completeSession,
  getUserSessions,
} from "../controllers/sessionsController.js";
import multer from "multer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Get user sessions
router.get("/", getUserSessions);

// Start new session
router.post("/", startSession);

// Submit answer to question
router.post("/:id/answer", upload.single("audio"), submitAnswer);

// Complete session
router.post("/:id/complete", completeSession);

export default router;
