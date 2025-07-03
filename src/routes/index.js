import express from "express";
import authRoutes from "./auth.js";
import profileRoutes from "./profile.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/profile", profileRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CodeQuest Backend API",
  });
});

export default router;
