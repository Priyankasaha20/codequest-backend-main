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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Invalid input
 */
router.post("/register", register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Login successful
 *       '401':
 *         description: Invalid credentials
 */
router.post("/login", login);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout the current user
 *     responses:
 *       '200':
 *         description: Logout successful
 */
router.post("/logout", logout);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Current user info
 *       '401':
 *         description: Not authenticated
 */
router.get("/me", isAuth, getCurrentUser);
/**
 * @swagger
 * /auth/verify:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify user email with token
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification token
 *     responses:
 *       '200':
 *         description: Email verified successfully
 *       '400':
 *         description: Invalid or expired token
 */
router.get("/verify", verifyEmail);

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

router.get("/success", oauthSuccess);
router.get("/failure", oauthFailure);

export default router;
