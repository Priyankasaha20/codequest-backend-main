import express from "express";
import {
  submitCode,
  getSubmission,
  getAllSubmissions,
  handleCallback,
  getUserSubmissions,
  getUserStats,
  getProblemSubmissions,
} from "../controllers/judgeController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Judge
 *   description: Code execution submissions
 */

/**
 * @swagger
 * /submit-code:
 *   post:
 *     summary: Submit code for execution
 *     tags: [Judge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Source code to execute
 *               languageId:
 *                 type: integer
 *                 description: Judge0 language ID
 *               stdin:
 *                 type: string
 *                 description: Input for single submission
 *               expectedOutput:
 *                 type: string
 *                 description: Expected output for single submission
 *               testcases:
 *                 type: array
 *                 description: Test cases for batch submission
 *                 items:
 *                   type: object
 *                   properties:
 *                     stdin:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *               problemId:
 *                 type: string
 *                 description: Problem identifier (optional)
 *               contestId:
 *                 type: string
 *                 description: Contest identifier (optional)
 *     responses:
 *       200:
 *         description: Tokens returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post("/submit-code", submitCode);

/**
 * @swagger
 * /submissions/{token}:
 *   get:
 *     summary: Get submission by token
 *     tags: [Judge]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Submission token
 *     responses:
 *       200:
 *         description: Submission record
 */
router.get("/submissions/:token", getSubmission);

/**
 * @swagger
 * /submissions:
 *   get:
 *     summary: List all submissions
 *     tags: [Judge]
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get("/submissions", getAllSubmissions);

/**
 * @swagger
 * /submissions/callback:
 *   post:
 *     summary: Judge0 callback endpoint
 *     tags: [Judge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               stdout:
 *                 type: string
 *               stderr:
 *                 type: string
 *               status:
 *                 type: object
 *     responses:
 *       200:
 *         description: Acknowledged
 */
router.put("/submissions/callback", handleCallback);

/**
 * @swagger
 * /submissions/user/{userId}:
 *   get:
 *     summary: Get submissions for a specific user
 *     tags: [Judge]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of submissions to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of submissions to skip
 *     responses:
 *       200:
 *         description: User submissions
 */
router.get("/submissions/user/:userId", getUserSubmissions);

/**
 * @swagger
 * /submissions/stats/{userId}:
 *   get:
 *     summary: Get submission statistics for a user
 *     tags: [Judge]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User submission statistics
 */
router.get("/submissions/stats/:userId", getUserStats);

/**
 * @swagger
 * /submissions/problem/{problemId}:
 *   get:
 *     summary: Get submissions for a specific problem
 *     tags: [Judge]
 *     parameters:
 *       - in: path
 *         name: problemId
 *         schema:
 *           type: string
 *         required: true
 *         description: Problem ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Optional user ID filter
 *     responses:
 *       200:
 *         description: Problem submissions
 */
router.get("/submissions/problem/:problemId", getProblemSubmissions);

export default router;
