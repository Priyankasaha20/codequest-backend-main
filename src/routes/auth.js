import express from "express";
import passport from "../config/passport.js";
import {
  register,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
} from "../controllers/authController.js";
import { oauthSuccess, oauthFailure } from "../controllers/oauthController.js";
import { isAuth } from "../middleware/auth.js";

const router = express.Router();

// Regular authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", isAuth, getCurrentUser);
router.get("/verify", verifyEmail);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
  }),
  oauthSuccess
);

// GitHub OAuth routes
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/auth/failure",
  }),
  oauthSuccess
);

// OAuth callback routes
router.get("/success", oauthSuccess);
router.get("/failure", oauthFailure);

export default router;
