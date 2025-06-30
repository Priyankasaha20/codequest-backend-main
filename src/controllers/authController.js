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

// Register a new user
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const userExists = await userExistsByEmail(email);
    if (userExists) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const newUser = new User({
      email,
      passwordHash,
      name: name || email.split("@")[0], // Use email prefix as default name
    });

    await newUser.save();

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

      // Return user data without password
      return res.json({
        message: "Login successful",
        user: sanitizeUser(user),
      });
    });
  })(req, res, next);
};

// Logout user
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

      res.clearCookie("connect.sid"); // Clear session cookie
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
