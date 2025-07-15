import express from "express";
import {
  submitCode,
  getSubmission,
  getAllSubmissions,
  handleCallback,
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
 *               languageId:
 *                 type: integer
 *               stdin:
 *                 type: string
 *               expectedOutput:
 *                 type: string
 *               testcases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     stdin:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
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
router.post("/submissions/callback", handleCallback);


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
 *               languageId:
 *                 type: integer
 *               stdin:
 *                 type: string
 *               expectedOutput:
 *                 type: string
 *               testcases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     stdin:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
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
router.post("/submissions/callback", handleCallback);

export default router;
