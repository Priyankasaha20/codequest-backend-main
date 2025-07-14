import express from "express";
import {
  startQuiz,
  getQuizQuestion,
  submitQuizAnswer,
} from "../controllers/quizController.js";
import { isAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: Quiz management endpoints
 */


/**
 * @swagger
 * /quiz/start:
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Start a new quiz session
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 enum: [DBMS, OOPS, OS, Networking]
 *                 description: Topic for the quiz (optional, random if not provided)
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Number of questions (max 50)
 *     responses:
 *       '200':
 *         description: Quiz session started successfully
 *       '401':
 *         description: Authentication required
 */
router.post("/start", isAuth, startQuiz);

/**
 * @swagger
 * /quiz/{quizSessionId}/question:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Get current question for the quiz session
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: quizSessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz session ID
 *     responses:
 *       '200':
 *         description: Current question retrieved successfully
 *       '404':
 *         description: Quiz session not found
 */
router.get("/:quizSessionId/question", isAuth, getQuizQuestion);

/**
 * @swagger
 * /quiz/{quizSessionId}/answer:
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Submit answer for current question
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: quizSessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answer:
 *                 type: string
 *                 enum: [A, B, C, D]
 *                 description: Selected answer option
 *             required:
 *               - answer
 *     responses:
 *       '200':
 *         description: Answer submitted successfully
 *       '400':
 *         description: Invalid answer or quiz completed
 *       '404':
 *         description: Quiz session not found
 */
router.post("/:quizSessionId/answer", isAuth, submitQuizAnswer);

export default router;
