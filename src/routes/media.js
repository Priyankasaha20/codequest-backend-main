import express from "express";
import { serveMedia } from "../controllers/mediaController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media file serving endpoints
 */

/**
 * @swagger
 * /media:
 *   get:
 *     tags:
 *       - Media
 *     summary: Serve media files (profile pictures, resumes) with access control
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: File path (e.g., /profile/user123_1234567890.jpg or /resume/user123_resume.pdf)
 *         example: /profile/user123_1234567890.jpg
 *     responses:
 *       '200':
 *         description: File served successfully
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       '403':
 *         description: Access denied - profile is private
 *       '404':
 *         description: File not found
 *       '500':
 *         description: Server error
 */
router.get("/", serveMedia);

export default router;
