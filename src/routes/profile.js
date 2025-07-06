import express from "express";
import multer from "multer";
import { isAuth } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadResume,
  getPublicProfile,
} from "../controllers/profileController.js";
import { checkProfileAccess } from "../middleware/profileAccess.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profile management endpoints
 */
/**
 * @swagger
 * /profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get current user's profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Profile data returned
 *       '401':
 *         description: Not authenticated
 */
router.get("/", isAuth, getProfile);
/**
 * @swagger
 * /profile:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update current user's profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               academicYear:
 *                 type: string
 *               institute:
 *                 type: string
 *               phone:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Not authenticated
 */
router.put("/", isAuth, updateProfile);
/**
 * @swagger
 * /profile/picture:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Upload profile picture
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Picture uploaded successfully
 *       '401':
 *         description: Not authenticated
 */
router.post("/picture", isAuth, upload.single("picture"), uploadProfilePicture);
/**
 * @swagger
 * /profile/resume:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Upload resume PDF
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Resume uploaded successfully
 *       '400':
 *         description: Invalid file type or size
 *       '401':
 *         description: Not authenticated
 */
router.post("/resume", isAuth, upload.single("resume"), uploadResume);
/**
 * @swagger
 * /profile/{userId}:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get a user's public profile
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: Public profile data
 *       '403':
 *         description: Profile is private
 *       '404':
 *         description: User not found
 */
router.get("/:userId", checkProfileAccess, getPublicProfile);

export default router;
