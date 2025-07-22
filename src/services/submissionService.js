import Submission from "../models/mongo/submission.js";

/**
 * Service class for handling Judge0 submissions with MongoDB persistence
 */
class SubmissionService {
  /**
   * Create a new submission record in MongoDB
   * @param {Object} submissionData - The submission data
   * @param {number} submissionData.userId - PostgreSQL user ID
   * @param {string} submissionData.code - Source code
   * @param {number} submissionData.languageId - Judge0 language ID
   * @param {string} submissionData.languageName - Language name
   * @param {string|undefined} submissionData.stdin - Input for single submission
   * @param {string|undefined} submissionData.expectedOutput - Expected output for single submission
   * @param {Array|undefined} submissionData.testcases - Test cases for batch submission
   * @param {Array} submissionData.tokens - Judge0 tokens
   * @param {string|undefined} submissionData.problemId - Problem identifier
   * @param {string|undefined} submissionData.contestId - Contest identifier
   * @returns {Promise<Submission>} Created submission document
   */
  static async createSubmission(submissionData) {
    const {
      userId,
      code,
      languageId,
      languageName,
      stdin,
      expectedOutput,
      testcases,
      tokens,
      problemId,
      contestId,
    } = submissionData;

    const submissionType =
      testcases && testcases.length > 0 ? "batch" : "single";

    const submission = new Submission({
      userId,
      tokens,
      sourceCode: code,
      language: {
        id: languageId,
        name: languageName || this.getLanguageName(languageId),
      },
      submissionType,
      stdin: submissionType === "single" ? stdin || "" : "",
      expectedOutput: submissionType === "single" ? expectedOutput || "" : "",
      testCases:
        submissionType === "batch"
          ? testcases.map((tc) => ({
              stdin: tc.stdin || "",
              expectedOutput: tc.expectedOutput,
              status: { id: 1, description: "In Queue" },
              verdict: "Pending",
            }))
          : [],
      problemId,
      contestId,
      judge0Data: {
        submittedAt: new Date(),
      },
    });

    return await submission.save();
  }

  /**
   * Update submission with Judge0 response data
   * @param {string} token - Judge0 submission token
   * @param {Object} judge0Response - Response from Judge0 API
   * @returns {Promise<Submission|null>} Updated submission or null if not found
   */
  static async updateSubmissionFromJudge0(token, judge0Response) {
    const submission = await Submission.findByToken(token);
    if (!submission) {
      return null;
    }

    const updateData = {
      status: judge0Response.status || submission.status,
      stdout: judge0Response.stdout || "",
      stderr: judge0Response.stderr || "",
      executionTime: judge0Response.time,
      memoryUsed: judge0Response.memory,
      compileOutput: judge0Response.compile_output || "",
    };

    if (judge0Response.finished_at) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
      updateData.judge0Data = {
        ...submission.judge0Data,
        finishedAt: new Date(judge0Response.finished_at),
        wallTime: judge0Response.wall_time,
        cpuTime: judge0Response.cpu_time,
      };
    }

    // Calculate verdict for single submissions
    if (
      submission.submissionType === "single" &&
      judge0Response.status?.description === "Accepted"
    ) {
      updateData.verdict =
        updateData.stdout?.trim() === submission.expectedOutput?.trim()
          ? "Accepted"
          : "Wrong Answer";
    } else if (
      judge0Response.status?.description &&
      judge0Response.status.description !== "Accepted"
    ) {
      updateData.verdict = judge0Response.status.description;
    }

    Object.assign(submission, updateData);
    return await submission.save();
  }

  /**
   * Update batch submission with multiple Judge0 responses
   * @param {Array} tokens - Array of Judge0 tokens
   * @param {Array} judge0Responses - Array of Judge0 responses
   * @returns {Promise<Submission|null>} Updated submission or null if not found
   */
  static async updateBatchSubmission(tokens, judge0Responses) {
    // Find submission that contains all these tokens
    const submission = await Submission.findOne({
      tokens: { $all: tokens },
    });

    if (!submission) {
      return null;
    }

    return await submission.updateBatchResults(judge0Responses);
  }

  /**
   * Get submission by token
   * @param {string} token - Judge0 submission token
   * @returns {Promise<Submission|null>} Submission document or null
   */
  static async getSubmissionByToken(token) {
    return await Submission.findByToken(token);
  }

  /**
   * Get submissions by user ID
   * @param {number} userId - PostgreSQL user ID
   * @param {number} limit - Number of submissions to return
   * @param {number} skip - Number of submissions to skip
   * @returns {Promise<Array>} Array of submission documents
   */
  static async getSubmissionsByUser(userId, limit = 50, skip = 0) {
    return await Submission.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  /**
   * Count total submissions for a user
   * @param {number} userId - PostgreSQL user ID
   * @returns {Promise<number>} Total number of submissions
   */
  static async countUserSubmissions(userId) {
    return await Submission.countDocuments({ userId });
  }

  /**
   * Get submissions by problem ID
   * @param {string} problemId - Problem identifier
   * @param {number|null} userId - Optional user ID filter
   * @returns {Promise<Array>} Array of submission documents
   */
  static async getSubmissionsByProblem(problemId, userId = null) {
    return await Submission.findByProblem(problemId, userId);
  }

  /**
   * Get user submission statistics
   * @param {number} userId - PostgreSQL user ID
   * @returns {Promise<Object>} Statistics object
   */
  static async getUserStats(userId) {
    const stats = await Submission.getSubmissionStats(userId);
    const total = await Submission.countDocuments({
      userId,
      isCompleted: true,
    });

    const formattedStats = {
      total,
      accepted: 0,
      wrongAnswer: 0,
      timeLimit: 0,
      runtimeError: 0,
      compilationError: 0,
      other: 0,
    };

    stats.forEach((stat) => {
      switch (stat._id) {
        case "Accepted":
          formattedStats.accepted = stat.count;
          break;
        case "Wrong Answer":
          formattedStats.wrongAnswer = stat.count;
          break;
        case "Time Limit Exceeded":
          formattedStats.timeLimit = stat.count;
          break;
        case "Runtime Error":
        case "Runtime Error (SIGSEGV)":
        case "Runtime Error (SIGXFSZ)":
        case "Runtime Error (SIGFPE)":
        case "Runtime Error (SIGABRT)":
        case "Runtime Error (NZEC)":
        case "Runtime Error (Other)":
          formattedStats.runtimeError += stat.count;
          break;
        case "Compilation Error":
          formattedStats.compilationError = stat.count;
          break;
        default:
          formattedStats.other += stat.count;
      }
    });

    return formattedStats;
  }

  /**
   * Clean up old submissions (called periodically)
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<number>} Number of deleted submissions
   */
  static async cleanupOldSubmissions(maxAge = 30 * 24 * 60 * 60 * 1000) {
    // 30 days default
    const cutoffDate = new Date(Date.now() - maxAge);
    const result = await Submission.deleteMany({
      createdAt: { $lt: cutoffDate },
      isCompleted: true,
    });
    return result.deletedCount;
  }

  /**
   * Get language name by ID (basic mapping)
   * @param {number} languageId - Judge0 language ID
   * @returns {string} Language name
   */
  static getLanguageName(languageId) {
    const languageMap = {
      45: "Assembly (NASM 2.14.02)",
      46: "Bash (5.0.0)",
      47: "Basic (FBC 1.07.1)",
      75: "C (Clang 7.0.1)",
      76: "C++ (Clang 7.0.1)",
      48: "C (GCC 7.4.0)",
      52: "C++ (GCC 7.4.0)",
      49: "C (GCC 8.3.0)",
      53: "C++ (GCC 8.3.0)",
      50: "C (GCC 9.2.0)",
      54: "C++ (GCC 9.2.0)",
      51: "C# (Mono 6.6.0.161)",
      77: "COBOL (GnuCOBOL 2.2)",
      55: "Common Lisp (SBCL 2.0.0)",
      56: "D (DMD 2.089.1)",
      57: "Elixir (1.9.4)",
      58: "Erlang (OTP 22.2)",
      44: "Executable",
      87: "F# (.NET Core SDK 3.1.202)",
      59: "Fortran (GFortran 9.2.0)",
      60: "Go (1.13.5)",
      88: "Groovy (3.0.3)",
      61: "Haskell (GHC 8.8.1)",
      62: "Java (OpenJDK 13.0.1)",
      63: "JavaScript (Node.js 12.14.0)",
      78: "Kotlin (1.3.70)",
      64: "Lua (5.3.5)",
      79: "Objective-C (Clang 7.0.1)",
      65: "OCaml (4.09.0)",
      66: "Octave (5.1.0)",
      67: "Pascal (FPC 3.0.4)",
      85: "Perl (5.28.1)",
      68: "PHP (7.4.1)",
      43: "Plain Text",
      69: "Prolog (GNU Prolog 1.4.5)",
      70: "Python (2.7.17)",
      71: "Python (3.8.1)",
      80: "R (4.0.0)",
      72: "Ruby (2.7.0)",
      73: "Rust (1.40.0)",
      81: "Scala (2.13.2)",
      82: "SQL (SQLite 3.27.2)",
      83: "Swift (5.2.3)",
      74: "TypeScript (3.7.4)",
      84: "Visual Basic.Net (vbnc 0.0.0.5943)",
    };

    return languageMap[languageId] || `Language ${languageId}`;
  }
}

export default SubmissionService;
