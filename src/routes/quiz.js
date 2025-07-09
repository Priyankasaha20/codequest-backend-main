import express from "express";
import { getQuizQuestions } from "../controllers/quizController.js";
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
 * /quiz/questions:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Get quiz questions based on topic or random
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *           enum: [DBMS, OOPS, OS, Networking]
 *         description: Topic for the quiz (optional, random if not provided)
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of questions to fetch (max 50)
 *     responses:
 *       '200':
 *         description: Quiz questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quiz:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     topic:
 *                       type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       question:
 *                         type: string
 *                       options:
 *                         type: object
 *                 totalQuestions:
 *                   type: integer
 *       '400':
 *         description: Invalid parameters
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: No questions found for the specified topic
 */
router.get("/questions", isAuth, getQuizQuestions);

export default router;
