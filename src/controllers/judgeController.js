import axios from "axios";
import SubmissionService from "../services/submissionService.js";
import QuestionService from "../services/questionService.js";

/**
 * Judge Controller - Handles code submission and execution via Judge0 API
 * Completely MongoDB-based with no in-memory storage
 */

/**
 * Validate submission input data
 * @param {string} code - Source code
 * @param {number} languageId - Judge0 language ID
 * @param {string} stdin - Input data (for single submissions)
 * @param {string} expectedOutput - Expected output (for single submissions)
 * @param {Array} testcases - Test cases (for batch submissions)
 * @param {string} questionId - Question ID (for question-based submissions)
 * @returns {string|null} Error message or null if valid
 */
function validateSubmissionInput(
  code,
  languageId,
  stdin,
  expectedOutput,
  testcases,
  questionId
) {
  // Validate code
  if (!code || typeof code !== "string") {
    return "Code must be a non-empty string";
  }
  if (code.length > 65536) {
    return "Code length exceeds maximum limit (65,536 characters)";
  }

  // Validate language ID
  if (!Number.isInteger(languageId) || languageId < 1) {
    return "Language ID must be a positive integer";
  }

  // Check submission type and validate accordingly
  const hasQuestionId = questionId && questionId.trim().length > 0;
  const hasSingleTestData = stdin !== undefined && expectedOutput !== undefined;
  const hasBatchTestData = Array.isArray(testcases) && testcases.length > 0;

  if (!hasQuestionId && !hasSingleTestData && !hasBatchTestData) {
    return "Either questionId, stdin/expectedOutput, or testcases array are required";
  }

  // Validate batch test cases if provided
  if (hasBatchTestData) {
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      if (!tc || typeof tc !== "object") {
        return `Test case at index ${i} must be an object`;
      }
      if (tc.stdin === undefined || tc.expectedOutput === undefined) {
        return `Test case at index ${i} must have stdin and expectedOutput properties`;
      }
    }
  }

  return null;
}

/**
 * POST /submit-code
 * Submit code for execution via Judge0 API
 */
export async function submitCode(req, res) {
  const {
    code,
    languageId,
    stdin,
    expectedOutput,
    testcases,
    questionId,
    problemId,
    contestId,
  } = req.body;

  // Validate input
  const validationError = validateSubmissionInput(
    code,
    languageId,
    stdin,
    expectedOutput,
    testcases,
    questionId
  );
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Get user ID from authentication
  let userId = req.user?.id || req.session?.userId;

  // For testing: allow userId to be passed in request body
  if (!userId && req.body.userId) {
    userId = req.body.userId;
    console.log("🧪 Using test userId:", userId);
  }

  if (!userId) {
    return res.status(401).json({ error: "User authentication required" });
  }

  try {
    let finalTestCases = testcases;
    let submissionType = "single";

    // If questionId is provided, get test cases from the question
    if (questionId) {
      try {
        const question = await QuestionService.getQuestionById(questionId);
        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        finalTestCases = question.testCases || [];
        submissionType = "batch";
      } catch (error) {
        console.error("Failed to get question:", error);
        return res.status(500).json({ error: "Failed to retrieve question" });
      }
    } else if (testcases && testcases.length > 0) {
      submissionType = "batch";
    }

    // Prepare Judge0 submission data
    const judge0BaseUrl = process.env.JUDGE0_BASE_URL;
    const callbackUrl = process.env.JUDGE0_CALLBACK_URL;
    let tokens = [];

    if (submissionType === "batch") {
      // Batch submission to Judge0
      const batchUrl = `${judge0BaseUrl}/submissions/batch?base64_encoded=false&wait=false`;
      const batchData = finalTestCases.map((tc) => ({
        source_code: code,
        language_id: languageId,
        stdin: tc.input || tc.stdin,
        ...(callbackUrl && { callback_url: callbackUrl }),
      }));

      const response = await axios.post(batchUrl, batchData, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;
      tokens = Array.isArray(data)
        ? data.map((r) => r.token)
        : data.tokens || [];

      if (tokens.length === 0) {
        return res
          .status(500)
          .json({ error: "No tokens returned from Judge0" });
      }
    } else {
      // Single submission to Judge0
      const singleUrl = `${judge0BaseUrl}/submissions?base64_encoded=false&wait=false`;
      const submissionData = {
        source_code: code,
        language_id: languageId,
        stdin: stdin || "",
        ...(callbackUrl && { callback_url: callbackUrl }),
      };

      const response = await axios.post(singleUrl, submissionData, {
        headers: { "Content-Type": "application/json" },
      });

      const { token } = response.data;
      if (!token) {
        return res.status(500).json({ error: "No token returned from Judge0" });
      }
      tokens = [token];
    }

    // Save submission to MongoDB
    try {
      const submission = await SubmissionService.createSubmission({
        userId,
        code,
        languageId,
        stdin: submissionType === "single" ? stdin : undefined,
        expectedOutput:
          submissionType === "single" ? expectedOutput : undefined,
        testcases: submissionType === "batch" ? finalTestCases : undefined,
        tokens,
        questionId,
        problemId,
        contestId,
      });

      return res.status(200).json({
        tokens,
        submissionId: submission._id,
        submissionType,
        message: "Code submitted successfully",
      });
    } catch (mongoError) {
      console.error("Failed to save submission to MongoDB:", mongoError);
      return res.status(500).json({ error: "Failed to save submission" });
    }
  } catch (error) {
    console.error("Submit code error:", error);
    if (error.response?.status === 429) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
    }
    return res.status(500).json({ error: "Failed to submit code to Judge0" });
  }
}

/**
 * GET /submissions/:token
 * Get submission status by token
 */
export async function getSubmission(req, res) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Get submission from MongoDB
    const submission = await SubmissionService.getSubmissionByToken(token);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // If submission is completed, return the stored data
    if (submission.isCompleted) {
      return res.json({
        token,
        submissionId: submission._id,
        status: submission.status.description,
        verdict: submission.verdict,
        stdout: submission.stdout,
        stderr: submission.stderr,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        compileOutput: submission.compileOutput,
        createdAt: submission.createdAt,
        completedAt: submission.completedAt,
        submissionType: submission.submissionType,
        testCases: submission.testCases,
        batchSummary: submission.batchSummary,
        question: submission.questionId,
      });
    }

    // If not completed, fetch from Judge0 API
    const judge0Url = `${process.env.JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`;
    const response = await axios.get(judge0Url);
    const judge0Data = response.data;

    const {
      stdout = "",
      stderr = "",
      status,
      time,
      memory,
      compile_output = "",
      finished_at,
    } = judge0Data;

    const statusDesc = status?.description || "Unknown";
    const isCompleted = !["In Queue", "Processing"].includes(statusDesc);

    // Prepare response data
    const responseData = {
      token,
      submissionId: submission._id,
      status: statusDesc,
      stdout,
      stderr,
      executionTime: time,
      memoryUsed: memory,
      compileOutput: compile_output,
      createdAt: submission.createdAt,
      submissionType: submission.submissionType,
      question: submission.questionId,
    };

    // Calculate verdict if completed
    if (isCompleted) {
      let verdict = statusDesc;
      if (
        statusDesc === "Accepted" &&
        submission.submissionType === "single" &&
        submission.expectedOutput
      ) {
        verdict =
          stdout.trim() === submission.expectedOutput.trim()
            ? "Accepted"
            : "Wrong Answer";
      }
      responseData.verdict = verdict;
      responseData.completedAt = finished_at
        ? new Date(finished_at)
        : new Date();

      // Update submission in MongoDB in the background
      SubmissionService.updateSubmissionFromJudge0(token, judge0Data).catch(
        (error) => {
          console.error("Failed to update submission in background:", error);
        }
      );
    }

    return res.json(responseData);
  } catch (error) {
    console.error("Get submission error:", error);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Submission not found in Judge0" });
    }
    return res
      .status(500)
      .json({ error: "Failed to fetch submission details" });
  }
}

/**
 * GET /submissions/user/:userId
 * Get submissions for a specific user
 */
export async function getUserSubmissions(req, res) {
  try {
    const { userId } = req.params;
    const {
      limit = 50,
      skip = 0,
      questionId,
      problemId,
      contestId,
    } = req.query;

    // Validate user ID
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if requesting user has permission to view these submissions
    const requestingUserId = req.user?.id || req.session?.userId;
    if (requestingUserId !== userIdNum && !req.user?.isAdmin) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view these submissions" });
    }

    // Get submissions with optional filters
    let submissions;
    if (questionId) {
      submissions = await SubmissionService.getSubmissionsByQuestion(
        questionId,
        userIdNum
      );
    } else if (problemId) {
      submissions = await SubmissionService.getSubmissionsByProblem(
        problemId,
        userIdNum
      );
    } else {
      submissions = await SubmissionService.getSubmissionsByUser(
        userIdNum,
        parseInt(limit),
        parseInt(skip)
      );
    }

    const total = await SubmissionService.countUserSubmissions(userIdNum);

    return res.json({
      total,
      submissions: submissions.map((sub) => ({
        id: sub._id,
        tokens: sub.tokens,
        language: sub.language,
        submissionType: sub.submissionType,
        verdict: sub.verdict,
        status: sub.status.description,
        executionTime: sub.executionTime,
        memoryUsed: sub.memoryUsed,
        questionId: sub.questionId,
        problemId: sub.problemId,
        contestId: sub.contestId,
        createdAt: sub.createdAt,
        completedAt: sub.completedAt,
        isCompleted: sub.isCompleted,
        batchSummary: sub.batchSummary,
      })),
    });
  } catch (error) {
    console.error("Get user submissions error:", error);
    return res.status(500).json({ error: "Failed to fetch user submissions" });
  }
}

/**
 * GET /submissions/stats/:userId
 * Get submission statistics for a user
 */
export async function getUserStats(req, res) {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const stats = await SubmissionService.getUserStats(userIdNum);
    return res.json(stats);
  } catch (error) {
    console.error("Get user stats error:", error);
    return res.status(500).json({ error: "Failed to fetch user statistics" });
  }
}

/**
 * GET /submissions/question/:questionId
 * Get submissions for a specific question
 */
export async function getQuestionSubmissions(req, res) {
  try {
    const { questionId } = req.params;
    const { userId } = req.query;

    const submissions = await SubmissionService.getSubmissionsByQuestion(
      questionId,
      userId ? parseInt(userId) : null
    );

    return res.json({
      total: submissions.length,
      submissions: submissions.map((sub) => ({
        id: sub._id,
        userId: sub.userId,
        tokens: sub.tokens,
        language: sub.language,
        verdict: sub.verdict,
        status: sub.status.description,
        executionTime: sub.executionTime,
        memoryUsed: sub.memoryUsed,
        createdAt: sub.createdAt,
        completedAt: sub.completedAt,
        isCompleted: sub.isCompleted,
        batchSummary: sub.batchSummary,
      })),
    });
  } catch (error) {
    console.error("Get question submissions error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch question submissions" });
  }
}

/**
 * POST /submissions/callback
 * Handle Judge0 callback responses
 */
export async function handleCallback(req, res) {
  console.log("Received Judge0 callback:", req.body);

  const {
    token,
    stdout = "",
    stderr = "",
    status,
    time,
    memory,
    compile_output = "",
    finished_at,
  } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required in callback" });
  }

  try {
    // Update submission in MongoDB
    const submission = await SubmissionService.updateSubmissionFromJudge0(
      token,
      req.body
    );

    if (!submission) {
      console.warn(`Callback received for unknown token: ${token}`);
      return res.status(404).json({ error: "Submission not found" });
    }

    console.log(`Successfully updated submission for token: ${token}`);
    return res.sendStatus(200);
  } catch (error) {
    console.error("Callback handling error:", error);
    return res.sendStatus(500);
  }
}

/**
 * GET /submissions/recent
 * Get recent submissions across all users
 */
export async function getRecentSubmissions(req, res) {
  try {
    const { limit = 20 } = req.query;
    const submissions = await SubmissionService.getRecentSubmissions(
      parseInt(limit)
    );

    return res.json({
      submissions: submissions.map((sub) => ({
        id: sub._id,
        userId: sub.userId,
        verdict: sub.verdict,
        executionTime: sub.executionTime,
        memoryUsed: sub.memoryUsed,
        language: sub.language,
        completedAt: sub.completedAt,
        question: sub.questionId,
      })),
    });
  } catch (error) {
    console.error("Get recent submissions error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch recent submissions" });
  }
}

/**
 * GET /submissions/leaderboard/:questionId
 * Get leaderboard for a specific question
 */
export async function getQuestionLeaderboard(req, res) {
  try {
    const { questionId } = req.params;
    const { limit = 100 } = req.query;

    const leaderboard = await SubmissionService.getQuestionLeaderboard(
      questionId,
      parseInt(limit)
    );

    return res.json({
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry._id,
        bestTime: entry.bestTime,
        bestMemory: entry.bestMemory,
        language: entry.language,
        submittedAt: entry.submittedAt,
      })),
    });
  } catch (error) {
    console.error("Get question leaderboard error:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
}

/**
 * GET /submissions
 * Get all submissions (admin only or for debugging)
 */
export async function getAllSubmissions(req, res) {
  try {
    // Simple implementation - in production, add proper pagination and admin checks
    const submissions = await SubmissionService.getRecentSubmissions(100);

    return res.json({
      total: submissions.length,
      submissions: submissions.map((sub) => ({
        id: sub._id,
        userId: sub.userId,
        tokens: sub.tokens,
        verdict: sub.verdict,
        status: sub.status?.description || "Unknown",
        executionTime: sub.executionTime,
        memoryUsed: sub.memoryUsed,
        language: sub.language,
        createdAt: sub.createdAt,
        completedAt: sub.completedAt,
        isCompleted: sub.isCompleted,
        question: sub.questionId,
      })),
    });
  } catch (error) {
    console.error("Get all submissions error:", error);
    return res.status(500).json({ error: "Failed to fetch submissions" });
  }
}
