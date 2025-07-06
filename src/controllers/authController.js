import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import User from "../models/user.js";
import {
  isValidEmail,
  validatePassword,
  hashPassword,
  userExistsByEmail,
  sanitizeUser,
} from "../services/authService.js";
import { sendVerificationEmail } from "../services/emailService.js";
import VerificationToken from "../models/verificationToken.js";

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

    const newUser = new User({
      email,
      passwordHash,
      name: name || email.split("@")[0],
    });

    await newUser.save();

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
    const record = await VerificationToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    const user = await User.findById(record.user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.emailVerified = true;
    await user.save();
    await VerificationToken.deleteOne({ _id: record._id });
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
