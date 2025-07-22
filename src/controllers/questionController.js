import QuestionService from "../services/questionService.js";

/**
 * Question Controller - Handles coding questions/problems management
 * Provides clean API for question operations
 */

/**
 * GET /questions
 * Get all active questions with optional filtering and pagination
 */
export async function getQuestions(req, res) {
  try {
    const filters = {
      difficulty: req.query.difficulty,
      category: req.query.category,
      tags: req.query.tags,
      search: req.query.search,
      limit: req.query.limit,
      skip: req.query.skip,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await QuestionService.getQuestions(filters);
    return res.json(result);
  } catch (error) {
    console.error("Get questions error:", error);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
}

/**
 * GET /questions/:slug
 * Get a specific question by slug
 */
export async function getQuestionBySlug(req, res) {
  try {
    const { slug } = req.params;
    const question = await QuestionService.getQuestionBySlug(slug);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.json({ question });
  } catch (error) {
    console.error("Get question by slug error:", error);
    return res.status(500).json({ error: "Failed to fetch question" });
  }
}

/**
 * GET /questions/id/:id
 * Get a specific question by ID
 */
export async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    const question = await QuestionService.getQuestionById(id);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.json({ question });
  } catch (error) {
    console.error("Get question by ID error:", error);
    return res.status(500).json({ error: "Failed to fetch question" });
  }
}

/**
 * GET /questions/difficulty/:level
 * Get questions by difficulty level
 */
export async function getQuestionsByDifficulty(req, res) {
  try {
    const { level } = req.params;
    const { limit = 20 } = req.query;

    if (!["Easy", "Medium", "Hard"].includes(level)) {
      return res.status(400).json({ error: "Invalid difficulty level" });
    }

    const questions = await QuestionService.getQuestionsByDifficulty(
      level,
      parseInt(limit)
    );
    return res.json({ questions });
  } catch (error) {
    console.error("Get questions by difficulty error:", error);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
}

/**
 * GET /questions/category/:category
 * Get questions by category
 */
export async function getQuestionsByCategory(req, res) {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const validCategories = QuestionService.getCategories();
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const questions = await QuestionService.getQuestionsByCategory(
      category,
      parseInt(limit)
    );
    return res.json({ questions });
  } catch (error) {
    console.error("Get questions by category error:", error);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
}

/**
 * GET /questions/search
 * Search questions by text
 */
export async function searchQuestions(req, res) {
  try {
    const { q: searchText, limit = 20 } = req.query;

    if (!searchText || searchText.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Search text must be at least 2 characters" });
    }

    const questions = await QuestionService.searchQuestions(
      searchText.trim(),
      parseInt(limit)
    );
    return res.json({ questions });
  } catch (error) {
    console.error("Search questions error:", error);
    return res.status(500).json({ error: "Failed to search questions" });
  }
}

/**
 * GET /questions/random
 * Get a random question with optional difficulty filter
 */
export async function getRandomQuestion(req, res) {
  try {
    const { difficulty } = req.query;

    if (difficulty && !["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty level" });
    }

    const question = await QuestionService.getRandomQuestion(difficulty);

    if (!question) {
      return res.status(404).json({ error: "No questions found" });
    }

    return res.json({ question });
  } catch (error) {
    console.error("Get random question error:", error);
    return res.status(500).json({ error: "Failed to fetch random question" });
  }
}

/**
 * GET /questions/contest/:contestId
 * Get questions for a specific contest
 */
export async function getContestQuestions(req, res) {
  try {
    const { contestId } = req.params;
    const questions = await QuestionService.getContestQuestions(contestId);

    return res.json({ questions });
  } catch (error) {
    console.error("Get contest questions error:", error);
    return res.status(500).json({ error: "Failed to fetch contest questions" });
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
 * PUT /questions/:id (Admin only)
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
 * DELETE /questions/:id (Admin only)
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
