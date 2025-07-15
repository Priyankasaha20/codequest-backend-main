import express from "express";
import authRoutes from "./auth.js";
import profileRoutes from "./profile.js";
import mediaRoutes from "./media.js";
import quizRoutes from "./quiz.js";
import judgeRoutes from "./judge.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/profile", profileRoutes);

router.use("/media", mediaRoutes);

router.use("/quiz", quizRoutes);

router.use("/", judgeRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CodeQuest Backend API",
  });
});

export default router;
