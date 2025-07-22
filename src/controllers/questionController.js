import QuestionService from "../services/questionService.js";

/**
 * Question Controller - Handles coding questions/problems management
 * Provides clean API for question operations with consolidated filtering
 */

/**
 * GET /questions
 * Get all active questions with optional filtering and pagination
 * Supports consolidated filtering via query parameters:
 * - ?difficulty={level} - Filter by difficulty
 * - ?category={category} - Filter by category
 * - ?contest={contestId} - Filter by contest
 * - ?search={text} - Search questions
 * - ?random=true - Get random question
 * - ?random=true&difficulty={level} - Get random question by difficulty
 * - ?tags={tag1,tag2} - Filter by tags
 * - ?limit={number} - Limit results
 * - ?skip={number} - Skip results for pagination
 * - ?sortBy={field} - Sort by field
 * - ?sortOrder={asc|desc} - Sort order
 */
export async function getQuestions(req, res) {
  try {
    const {
      difficulty,
      category,
      contest,
      search,
      random,
      tags,
      limit,
      skip,
      sortBy,
      sortOrder,
    } = req.query;

    // Handle random question request
    if (random === "true") {
      if (difficulty && !["Easy", "Medium", "Hard"].includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty level" });
      }

      const question = await QuestionService.getRandomQuestion(difficulty);

      if (!question) {
        return res.status(404).json({ error: "No questions found" });
      }

      return res.json({ question });
    }

    // Handle contest questions request
    if (contest) {
      const questions = await QuestionService.getContestQuestions(contest);
      return res.json({ questions });
    }

    // Handle search request
    if (search) {
      if (!search || search.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Search text must be at least 2 characters" });
      }
    }

    // Validate difficulty if provided
    if (difficulty && !["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty level" });
    }

    // Validate category if provided
    if (category) {
      const validCategories = QuestionService.getCategories();
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    const filters = {
      difficulty,
      category,
      tags,
      search: search?.trim(),
      contestId: contest,
      limit,
      skip,
      sortBy,
      sortOrder,
    };

    const result = await QuestionService.getQuestions(filters);
    return res.json(result);
  } catch (error) {
    console.error("Get questions error:", error);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
}

/**
 * GET /questions/{id}
 * Get a specific question by ID or slug
 * This handles both MongoDB ObjectId and slug formats
 */
export async function getQuestionByIdOrSlug(req, res) {
  try {
    const { id } = req.params;

    // Check if it's a MongoDB ObjectId pattern
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let question;
    if (isObjectId) {
      question = await QuestionService.getQuestionById(id);
    } else {
      // Treat as slug
      question = await QuestionService.getQuestionBySlug(id);
    }

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.json({ question });
  } catch (error) {
    console.error("Get question by ID/slug error:", error);
    return res.status(500).json({ error: "Failed to fetch question" });
  }
}

/**
 * GET /questions/stats
 * Get overall question statistics
 */
export async function getQuestionStats(req, res) {
  try {
    const stats = await QuestionService.getQuestionStats();
    return res.json({ stats });
  } catch (error) {
    console.error("Get question stats error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch question statistics" });
  }
}

/**
 * GET /questions/categories
 * Get all available categories
 */
export async function getCategories(req, res) {
  try {
    const categories = QuestionService.getCategories();
    return res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
}

/**
 * GET /questions/difficulties
 * Get all available difficulty levels
 */
export async function getDifficultyLevels(req, res) {
  try {
    const difficulties = QuestionService.getDifficultyLevels();
    return res.json({ difficulties });
  } catch (error) {
    console.error("Get difficulty levels error:", error);
    return res.status(500).json({ error: "Failed to fetch difficulty levels" });
  }
}

// ==================== ADMIN ROUTES ====================

/**
 * POST /questions (Admin only)
 * Create a new question
 */
export async function createQuestion(req, res) {
  try {
    // Check if user is admin (implement your admin check logic)
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const questionData = req.body;

    // Validate question data
    const validation = QuestionService.validateQuestionData(questionData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Invalid question data",
        details: validation.errors,
      });
    }

    const question = await QuestionService.createQuestion(questionData);
    return res.status(201).json({ question });
  } catch (error) {
    console.error("Create question error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Question with this slug already exists" });
    }
    return res.status(500).json({ error: "Failed to create question" });
  }
}

/**
 * PUT /questions/{id} (Admin only)
 * Update an existing question
 */
export async function updateQuestion(req, res) {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Validate update data
    const validation = QuestionService.validateQuestionData(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Invalid question data",
        details: validation.errors,
      });
    }

    const question = await QuestionService.updateQuestion(id, updateData);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.json({ question });
  } catch (error) {
    console.error("Update question error:", error);
    return res.status(500).json({ error: "Failed to update question" });
  }
}

/**
 * DELETE /questions/{id} (Admin only)
 * Delete a question (soft delete)
 */
export async function deleteQuestion(req, res) {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const success = await QuestionService.deleteQuestion(id);

    if (!success) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Delete question error:", error);
    return res.status(500).json({ error: "Failed to delete question" });
  }
}
