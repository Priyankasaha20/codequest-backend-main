import Question from "../models/mongo/question.js";

/**
 * Service class for handling coding questions/problems
 * Provides clean API for question management and retrieval
 */
class QuestionService {
  /**
   * Get all active questions with optional filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.difficulty - Filter by difficulty level
   * @param {string} filters.category - Filter by category
   * @param {Array|string} filters.tags - Filter by tags
   * @param {string} filters.search - Search in title/description
   * @param {number} filters.limit - Number of questions to return
   * @param {number} filters.skip - Number of questions to skip
   * @param {string} filters.sortBy - Sort field (createdAt, difficulty, title, acceptanceRate)
   * @param {string} filters.sortOrder - Sort order (asc, desc)
   * @returns {Promise<Object>} Questions with metadata
   */
  static async getQuestions(filters = {}) {
    const {
      difficulty,
      category,
      tags,
      search,
      limit = 50,
      skip = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build query
    let query = { isActive: true };

    if (difficulty) {
      query["difficulty.level"] = difficulty;
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Build sort object
    const sortObj = {};
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    switch (sortBy) {
      case "difficulty":
        sortObj["difficulty.score"] = sortDirection;
        break;
      case "title":
        sortObj.title = sortDirection;
        break;
      case "acceptanceRate":
        sortObj["stats.acceptanceRate"] = sortDirection;
        break;
      case "popularity":
        sortObj["stats.totalSubmissions"] = sortDirection;
        break;
      default:
        sortObj.createdAt = sortDirection;
    }

    // Execute query
    const questions = await Question.find(query)
      .sort(sortObj)
      .limit(Number(limit))
      .skip(Number(skip))
      .select({
        title: 1,
        slug: 1,
        difficulty: 1,
        category: 1,
        tags: 1,
        stats: 1,
        isVerified: 1,
        createdAt: 1,
      });

    const total = await Question.countDocuments(query);

    return {
      questions: questions.map((q) => q.getSummary()),
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > skip + limit,
      },
    };
  }

  /**
   * Get a single question by slug with full details
   * @param {string} slug - Question slug
   * @returns {Promise<Object|null>} Question details or null if not found
   */
  static async getQuestionBySlug(slug) {
    const question = await Question.findBySlug(slug);
    return question ? question.getFullDetails() : null;
  }

  /**
   * Get a single question by ID with full details
   * @param {string} id - Question ID
   * @returns {Promise<Object|null>} Question details or null if not found
   */
  static async getQuestionById(id) {
    const question = await Question.findById(id).where({ isActive: true });
    return question ? question.getFullDetails() : null;
  }

  /**
   * Get question test cases for Judge0 submission
   * @param {string} questionId - Question ID
   * @returns {Promise<Array>} Array of test cases
   */
  static async getQuestionTestCases(questionId) {
    const question = await Question.findById(questionId).select("testCases");
    if (!question) {
      throw new Error("Question not found");
    }

    return question.testCases.map((tc) => ({
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      weight: tc.weight,
    }));
  }

  /**
   * Get questions by difficulty level
   * @param {string} level - Difficulty level (Easy, Medium, Hard)
   * @param {number} limit - Number of questions to return
   * @returns {Promise<Array>} Array of questions
   */
  static async getQuestionsByDifficulty(level, limit = 20) {
    const questions = await Question.findByDifficulty(level).limit(limit);
    return questions.map((q) => q.getSummary());
  }

  /**
   * Get questions by category
   * @param {string} category - Question category
   * @param {number} limit - Number of questions to return
   * @returns {Promise<Array>} Array of questions
   */
  static async getQuestionsByCategory(category, limit = 20) {
    const questions = await Question.findByCategory(category).limit(limit);
    return questions.map((q) => q.getSummary());
  }

  /**
   * Search questions by text
   * @param {string} searchText - Text to search for
   * @param {number} limit - Number of questions to return
   * @returns {Promise<Array>} Array of matching questions
   */
  static async searchQuestions(searchText, limit = 20) {
    const questions = await Question.searchProblems(searchText, limit);
    return questions.map((q) => q.getSummary());
  }

  /**
   * Get a random question
   * @param {string} difficulty - Optional difficulty filter
   * @returns {Promise<Object|null>} Random question or null
   */
  static async getRandomQuestion(difficulty = null) {
    const results = await Question.getRandomProblem(difficulty);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get contest questions
   * @param {string} contestId - Contest ID
   * @returns {Promise<Array>} Array of contest questions
   */
  static async getContestQuestions(contestId) {
    const questions = await Question.findByContest(contestId);
    return questions.map((q) => q.getSummary());
  }

  /**
   * Update question statistics after submission
   * @param {string} questionId - Question ID
   * @param {Object} submissionData - Submission result data
   * @returns {Promise<void>}
   */
  static async updateQuestionStats(questionId, submissionData) {
    const question = await Question.findById(questionId);
    if (question) {
      await question.updateStats(submissionData);
    }
  }

  /**
   * Get overall question statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getQuestionStats() {
    return await Question.getStats();
  }

  /**
   * Create a new question (admin function)
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Created question
   */
  static async createQuestion(questionData) {
    const question = new Question(questionData);
    await question.save();
    return question.getFullDetails();
  }

  /**
   * Update an existing question (admin function)
   * @param {string} id - Question ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated question or null
   */
  static async updateQuestion(id, updateData) {
    const question = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return question ? question.getFullDetails() : null;
  }

  /**
   * Delete a question (admin function)
   * @param {string} id - Question ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteQuestion(id) {
    // Soft delete by setting isActive to false
    const result = await Question.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  /**
   * Get all available categories
   * @returns {Array} Array of categories
   */
  static getCategories() {
    return [
      "Array",
      "String",
      "Dynamic Programming",
      "Tree",
      "Graph",
      "Sorting",
      "Searching",
      "Math",
      "Greedy",
      "Backtracking",
      "Two Pointers",
      "Sliding Window",
      "Stack",
      "Queue",
      "Heap",
      "Hash Table",
      "Linked List",
      "Binary Search",
      "Other",
    ];
  }

  /**
   * Get all available difficulty levels
   * @returns {Array} Array of difficulty levels
   */
  static getDifficultyLevels() {
    return ["Easy", "Medium", "Hard"];
  }

  /**
   * Validate question data before creation/update
   * @param {Object} questionData - Question data to validate
   * @returns {Object} Validation result
   */
  static validateQuestionData(questionData) {
    const errors = [];

    // Required fields
    if (!questionData.title) errors.push("Title is required");
    if (!questionData.description) errors.push("Description is required");
    if (!questionData.difficulty) errors.push("Difficulty is required");
    if (!questionData.category) errors.push("Category is required");

    // Examples validation
    if (!questionData.examples || questionData.examples.length === 0) {
      errors.push("At least one example is required");
    }

    // Test cases validation
    if (!questionData.testCases || questionData.testCases.length === 0) {
      errors.push("At least one test case is required");
    }

    // Validate category
    if (
      questionData.category &&
      !this.getCategories().includes(questionData.category)
    ) {
      errors.push("Invalid category");
    }

    // Validate difficulty
    if (
      questionData.difficulty &&
      !this.getDifficultyLevels().includes(questionData.difficulty.level)
    ) {
      errors.push("Invalid difficulty level");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default QuestionService;
