import express from "express";
import {
  getQuestions,
  getQuestionByIdOrSlug,
  getQuestionStats,
  getCategories,
  getDifficultyLevels,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Question ID
 *         title:
 *           type: string
 *           description: Question title
 *           maxLength: 200
 *         slug:
 *           type: string
 *           description: URL-friendly identifier
 *         description:
 *           type: string
 *           description: Problem statement
 *           maxLength: 5000
 *         difficulty:
 *           $ref: '#/components/schemas/Difficulty'
 *         examples:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Example'
 *         constraints:
 *           $ref: '#/components/schemas/Constraints'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         category:
 *           type: string
 *           enum: [Array, String, Dynamic Programming, Tree, Graph, Sorting, Searching, Math, Greedy, Backtracking, Two Pointers, Sliding Window, Stack, Queue, Heap, Hash Table, Linked List, Binary Search, Other]
 *         author:
 *           type: string
 *           default: System
 *         source:
 *           type: string
 *         hints:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 500
 *         isActive:
 *           type: boolean
 *           default: true
 *         isVerified:
 *           type: boolean
 *           default: false
 *         stats:
 *           $ref: '#/components/schemas/ProblemStats'
 *         contestId:
 *           type: string
 *           nullable: true
 *         contestOrder:
 *           type: number
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Difficulty:
 *       type: object
 *       properties:
 *         level:
 *           type: string
 *           enum: [Easy, Medium, Hard]
 *         score:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *     Example:
 *       type: object
 *       properties:
 *         input:
 *           type: string
 *         output:
 *           type: string
 *         explanation:
 *           type: string
 *     Constraints:
 *       type: object
 *       properties:
 *         timeLimit:
 *           type: number
 *         memoryLimit:
 *           type: number
 *         inputConstraints:
 *           type: array
 *           items:
 *             type: string
 *     ProblemStats:
 *       type: object
 *       properties:
 *         totalSubmissions:
 *           type: number
 *           default: 0
 *           description: Total number of submissions for this question
 *         acceptedSubmissions:
 *           type: number
 *           default: 0
 *           description: Number of accepted submissions
 *         acceptanceRate:
 *           type: number
 *           default: 0
 *           description: Acceptance rate percentage (0-100)
 *         averageExecutionTime:
 *           type: number
 *           description: Average execution time in milliseconds
 *         averageMemoryUsage:
 *           type: number
 *           description: Average memory usage in KB
 *     TestCase:
 *       type: object
 *       properties:
 *         input:
 *           type: string
 *           description: Test case input data
 *         expectedOutput:
 *           type: string
 *           description: Expected output for the test case
 *         isHidden:
 *           type: boolean
 *           default: false
 *           description: Whether this test case is hidden from users during practice
 *     QuestionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Question'
 *     QuestionsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             questions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 total:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         error:
 *           type: string
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 */

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: |
 *     Comprehensive question management system for coding challenges.
 *
 *     **Features:**
 *     - LeetCode-style coding problems
 *     - Flexible filtering and search
 *     - Difficulty-based categorization
 *     - Tag-based organization
 *     - Contest support
 *     - Statistics tracking
 *     - Admin management tools
 *
 *     **API Consolidation:**
 *     This API uses a consolidated approach with query parameters instead of multiple endpoints.
 *     All filtering operations are handled through the main `/questions` endpoint.
 */

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /questions:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get questions with flexible filtering
 *     description: |
 *       Retrieve questions with various filtering options via query parameters.
 *       Consolidates multiple specific endpoints into one flexible endpoint.
 *
 *       **Filtering Options:**
 *       - `difficulty={level}` - Filter by difficulty (Easy, Medium, Hard)
 *       - `category={category}` - Filter by category
 *       - `contest={contestId}` - Filter by contest ID
 *       - `search={text}` - Search in title/description/tags
 *       - `random=true` - Get a random question
 *       - `random=true&difficulty={level}` - Get random question by difficulty
 *       - `tags={tag1,tag2}` - Filter by tags
 *
 *       **Pagination & Sorting:**
 *       - `limit={number}` - Number of results (default: 50)
 *       - `skip={number}` - Number to skip (default: 0)
 *       - `sortBy={field}` - Sort field (createdAt, difficulty, title, acceptanceRate, popularity)
 *       - `sortOrder={asc|desc}` - Sort order (default: desc)
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [Easy, Medium, Hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: contest
 *         schema:
 *           type: string
 *         description: Filter by contest ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search text (minimum 2 characters)
 *       - in: query
 *         name: random
 *         schema:
 *           type: boolean
 *         description: Get random question(s)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of questions to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of questions to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, difficulty, title, acceptanceRate, popularity]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/QuestionsListResponse'
 *                 - $ref: '#/components/schemas/QuestionResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", getQuestions);

/**
 * @swagger
 * /questions/categories:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get all available question categories
 *     description: Retrieve a list of all available question categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Array, String, Dynamic Programming, Tree, Graph]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/categories", getCategories);

/**
 * @swagger
 * /questions/difficulties:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get all available difficulty levels
 *     description: Retrieve a list of all available difficulty levels
 *     responses:
 *       200:
 *         description: Difficulty levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 difficulties:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Easy, Medium, Hard]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/difficulties", getDifficultyLevels);

/**
 * @swagger
 * /questions/stats:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get overall question statistics
 *     description: Retrieve statistics about questions including count by difficulty and acceptance rates
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalProblems:
 *                       type: number
 *                     byDifficulty:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                           avgAcceptanceRate:
 *                             type: number
 *                           totalSubmissions:
 *                             type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/stats", getQuestionStats);

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get a specific question by ID or slug
 *     description: Retrieve a question using either its MongoDB ObjectId or URL-friendly slug identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId or slug of the question
 *         examples:
 *           objectId:
 *             summary: MongoDB ObjectId
 *             value: "507f1f77bcf86cd799439011"
 *           slug:
 *             summary: URL-friendly slug
 *             value: "two-sum"
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionResponse'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", getQuestionByIdOrSlug);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /questions:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create a new question (Admin only)
 *     description: Create a new coding question with all required details including test cases
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - description
 *               - difficulty
 *               - examples
 *               - constraints
 *               - testCases
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Question title
 *                 example: "Two Sum"
 *               slug:
 *                 type: string
 *                 pattern: "^[a-z0-9-]+$"
 *                 description: URL-friendly identifier
 *                 example: "two-sum"
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Problem statement
 *                 example: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
 *               difficulty:
 *                 type: object
 *                 properties:
 *                   level:
 *                     type: string
 *                     enum: [Easy, Medium, Hard]
 *                   score:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 10
 *               examples:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *                     explanation:
 *                       type: string
 *               constraints:
 *                 type: object
 *                 properties:
 *                   timeLimit:
 *                     type: number
 *                   memoryLimit:
 *                     type: number
 *                   inputConstraints:
 *                     type: array
 *                     items:
 *                       type: string
 *               testCases:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *                     isHidden:
 *                       type: boolean
 *                       default: false
 *               category:
 *                 type: string
 *                 enum: [Array, String, Dynamic Programming, Tree, Graph, Sorting, Searching, Math, Greedy, Backtracking, Two Pointers, Sliding Window, Stack, Queue, Heap, Hash Table, Linked List, Binary Search, Other]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               author:
 *                 type: string
 *                 default: System
 *               source:
 *                 type: string
 *               hints:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *               contestId:
 *                 type: string
 *                 nullable: true
 *               contestOrder:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionResponse'
 *       400:
 *         description: Invalid input data or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Question with this slug already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", createQuestion);

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     tags:
 *       - Questions
 *     summary: Update an existing question (Admin only)
 *     description: Update any field of an existing question
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the question to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               slug:
 *                 type: string
 *                 pattern: "^[a-z0-9-]+$"
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               difficulty:
 *                 type: object
 *                 properties:
 *                   level:
 *                     type: string
 *                     enum: [Easy, Medium, Hard]
 *                   score:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 10
 *               examples:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *                     explanation:
 *                       type: string
 *               constraints:
 *                 type: object
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *                     isHidden:
 *                       type: boolean
 *               category:
 *                 type: string
 *                 enum: [Array, String, Dynamic Programming, Tree, Graph, Sorting, Searching, Math, Greedy, Backtracking, Two Pointers, Sliding Window, Stack, Queue, Heap, Hash Table, Linked List, Binary Search, Other]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               author:
 *                 type: string
 *               source:
 *                 type: string
 *               hints:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *               isActive:
 *                 type: boolean
 *               isVerified:
 *                 type: boolean
 *               contestId:
 *                 type: string
 *                 nullable: true
 *               contestOrder:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionResponse'
 *       400:
 *         description: Invalid input data or question ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Slug already exists (if updating slug)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", updateQuestion);

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     tags:
 *       - Questions
 *     summary: Delete a question (Admin only) - Soft delete
 *     description: Soft delete a question by setting isActive to false
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the question to delete
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Question deleted successfully"
 *       400:
 *         description: Invalid question ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", deleteQuestion);

export default router;
