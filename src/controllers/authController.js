import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import { db } from "../config/dbPostgres.js";
import { users, verificationTokens } from "../models/postgres/schema.js";
import { eq, and, lt } from "drizzle-orm";
import {
  isValidEmail,
  validatePassword,
  hashPassword,
  userExistsByEmail,
  sanitizeUser,
} from "../services/authService.js";
import { sendVerificationEmail } from "../services/emailService.js";

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
      });
    }

    const userExists = await userExistsByEmail(email);
    if (userExists) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    // Create user with Drizzle ORM
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name: name || email.split("@")[0],
      })
      .returning();

    // send verification email
    await sendVerificationEmail(newUser);

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({
          error: "Registration successful but login failed",
        });
      }

      return res.status(201).json({
        message: "User registered successfully",
        user: sanitizeUser(newUser),
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;

    // Find verification token with Drizzle ORM
    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          lt(new Date(), verificationTokens.expiresAt)
        )
      );

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Find and update user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, record.userId));

    // Delete verification token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, record.id));

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Login user
export const login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        error: "Internal server error",
      });
    }

    if (!user) {
      return res.status(401).json({
        error: info.message || "Invalid credentials",
      });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          error: "Login failed",
        });
      }

      return res.json({
        message: "Login successful",
        user: sanitizeUser(user),
      });
    });
  })(req, res, next);
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: "Logout failed",
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: "Session destruction failed",
        });
      }

      res.clearCookie("connect.sid");
      return res.json({
        message: "Logout successful",
      });
    });
  });
};

// Get current user
export const getCurrentUser = (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      user: sanitizeUser(req.user),
    });
  }

  return res.status(401).json({
    error: "Not authenticated",
  });
};
