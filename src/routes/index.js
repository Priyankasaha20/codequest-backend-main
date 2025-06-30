import express from "express";
import authRoutes from "./auth.js";

const router = express.Router();

// Mount auth routes
router.use("/auth", authRoutes);


// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CodeQuest Backend API",
  });
});


export default router;
