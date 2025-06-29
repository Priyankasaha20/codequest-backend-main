import express from "express";
import authRoutes from "./auth.js";
import submissionRoutes from "./submissions.js";
import webhookRoutes from "./webhook.js";

const router = express.Router();

// Mount auth routes
router.use("/auth", authRoutes);

// Mount submission routes
router.use("/submissions", submissionRoutes);

// Mount webhook routes
router.use("/judge0-webhook", webhookRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CodeQuest Backend API",
  });
});

// API info route
router.get("/", (req, res) => {
  res.json({
    message: "CodeQuest Backend API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        me: "GET /api/auth/me",
        google: "GET /api/auth/google",
        github: "GET /api/auth/github",
      },
      submissions: {
        submit: "POST /api/submissions",
        getSubmission: "GET /api/submissions/:id",
      },
      webhooks: {
        judge0: "POST /api/judge0-webhook",
      },
    },
  });
});

export default router;
