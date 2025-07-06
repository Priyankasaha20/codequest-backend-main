import express from "express";
import authRoutes from "./auth.js";
import profileRoutes from "./profile.js";
import interviewTypesRoutes from "./interviewTypes.js";
import sessionsRoutes from "./sessions.js";
import mediaRoutes from "./media.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/interview-types", interviewTypesRoutes);
router.use("/sessions", sessionsRoutes);

// If you want coach routes, you can alias sessions
router.use("/coach/session", sessionsRoutes);

router.use("/media", mediaRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CodeQuest Backend API",
  });
});

export default router;
