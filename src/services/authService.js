import bcrypt from "bcrypt";
import { db } from "../config/dbPostgres.js";
import { users } from "../models/postgres/schema.js";
import { eq } from "drizzle-orm";

/**
 * Validates email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password
 * @returns {object} validation result
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  const isValid =
    password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;

  return {
    isValid,
    errors: [
      password.length < minLength
        ? `Password must be at least ${minLength} characters long`
        : null,
      !hasUpperCase
        ? "Password must contain at least one uppercase letter"
        : null,
      !hasLowerCase
        ? "Password must contain at least one lowercase letter"
        : null,
      !hasNumbers ? "Password must contain at least one number" : null,
    ].filter(Boolean),
  };
};

/**
 * Hashes a password
 * @param {string} password
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares password with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Checks if user exists by email
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export const userExistsByEmail = async (email) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return !!user;
};

/**
 * Sanitizes user object for client response
 * @param {object} user
 * @returns {object}
 */
export const sanitizeUser = (user) => {
  const { passwordHash, ...sanitizedUser } = user;
  return sanitizedUser;
};
