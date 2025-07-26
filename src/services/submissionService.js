import { Submission } from "../models/mongo/index.js";
import QuestionService from "./questionService.js";
import axios from "axios";

/**
 * Submission Service - Handles all submission-related operations
 * Completely MongoDB-based with no in-memory storage
 */

class SubmissionService {
  constructor() {
    this.judge0Host = process.env.JUDGE0_HOST || "localhost";
    this.judge0Port = process.env.JUDGE0_PORT || "2358";
    this.judge0Url = `http://${this.judge0Host}:${this.judge0Port}`;
  }

  /**
   * Create a submission (alternative interface for compatibility)
   */
  async createSubmission(submissionData) {
    const {
      userId,
      code,
      languageId,
      questionId,
      tokens,
      stdin,
      expectedOutput,
      testcases,
    } = submissionData;

    // Convert languageId to language name for internal consistency
    const languageMap = {
      71: "python",
      63: "javascript",
      62: "java",
      54: "cpp",
      50: "c",
    };

    const language = languageMap[languageId] || "python";

    try {
      const submission = await Submission.create({
        questionId,
        userId,
        code,
        language,
        status: {
          id: 1, // In Queue
          description: "In Queue",
        },
        tokens: tokens || [],
        isCompleted: false,
        stdin: stdin,
        expectedOutput: expectedOutput,
        testCases: testcases,
        submissionType: testcases ? "batch" : "single",
      });

      return submission;
    } catch (error) {
      console.error("Create submission error:", error);
      throw error;
    }
  }

  /**
   * Get submission by token
   */
  async getSubmissionByToken(token) {
    try {
      const submission = await Submission.findOne({
        tokens: { $in: [token] },
      })
        .populate("questionId", "title slug difficulty")
        .lean();

      return submission;
    } catch (error) {
      console.error("Get submission by token error:", error);
      throw error;
    }
  }

  /**
   * Submit code for execution
   */
  async submitCode({ questionId, userId, code, language }) {
    try {
      // Validate that the question exists
      const question = await QuestionService.getQuestionById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      // Prepare submission for Judge0
      const judge0Payload = {
        source_code: code,
        language_id: this.getLanguageId(language),
        stdin: "", // Will be set per test case
        expected_output: "", // Will be set per test case
      };

      // Create submission record
      const submission = await Submission.create({
        questionId,
        userId,
        code,
        language,
        status: {
          id: 1, // In Queue
          description: "In Queue",
        },
        tokens: [], // Will store Judge0 tokens for each test case
        isCompleted: false,
      });

      // Submit each test case to Judge0
      const testCases = question.testCases || [];
      const judge0Submissions = [];

      for (const testCase of testCases) {
        const testPayload = {
          ...judge0Payload,
          stdin: testCase.input,
          expected_output: testCase.expectedOutput,
        };

        try {
          const response = await axios.post(
            `${this.judge0Url}/submissions`,
            testPayload,
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );

          judge0Submissions.push({
            token: response.data.token,
            testCaseIndex: testCases.indexOf(testCase),
            isHidden: testCase.isHidden,
          });
        } catch (error) {
          console.error("Judge0 submission error:", error);
          // Continue with other test cases even if one fails
        }
      }

      // Update submission with Judge0 tokens
      submission.tokens = judge0Submissions.map((sub) => sub.token);
      submission.judge0Data = {
        submissions: judge0Submissions,
        totalTestCases: testCases.length,
      };
      await submission.save();

      return submission;
    } catch (error) {
      console.error("Submit code error:", error);
      throw error;
    }
  }

  /**
   * Update submission with Judge0 results
   */
  async updateSubmissionFromJudge0(submissionId, judge0Results) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Process Judge0 results
      let allPassed = true;
      let totalExecutionTime = 0;
      let totalMemoryUsed = 0;
      let validResults = 0;

      const results = judge0Results.map((result) => {
        if (result.status?.id === 3) {
          // Accepted
          totalExecutionTime += result.time ? parseFloat(result.time) : 0;
          totalMemoryUsed += result.memory ? parseFloat(result.memory) : 0;
          validResults++;
        } else {
          allPassed = false;
        }
        return result;
      });

      // Update submission
      submission.judge0Data.results = results;
      submission.isCompleted = true;
      submission.completedAt = new Date();
      submission.isCorrect = allPassed;

      // Calculate averages
      if (validResults > 0) {
        submission.executionTime = totalExecutionTime / validResults;
        submission.memoryUsed = totalMemoryUsed / validResults;
      }

      // Set overall status based on results
      if (allPassed) {
        submission.status = {
          id: 3,
          description: "Accepted",
        };
        submission.verdict = "Accepted";
      } else {
        // Find the most relevant error status
        const errorResult = results.find((r) => r.status?.id !== 3);
        submission.status = errorResult?.status || {
          id: 6,
          description: "Compilation Error",
        };
        submission.verdict = errorResult?.status?.description || "Wrong Answer";
      }

      await submission.save();

      // Update question statistics
      if (submission.questionId) {
        await QuestionService.updateQuestionStats(submission.questionId, {
          isAccepted: allPassed,
          executionTime: submission.executionTime,
          memoryUsed: submission.memoryUsed,
        });
      }

      return submission;
    } catch (error) {
      console.error("Update submission error:", error);
      throw error;
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmission(submissionId) {
    try {
      const submission = await Submission.findById(submissionId)
        .populate("questionId", "title slug difficulty")
        .lean();
      return submission;
    } catch (error) {
      console.error("Get submission error:", error);
      throw error;
    }
  }

  /**
   * Get submissions by user
   */
  async getSubmissionsByUser(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, questionId } = options;

      const filter = { userId };
      if (questionId) {
        filter.questionId = questionId;
      }

      const submissions = await Submission.find(filter)
        .populate("questionId", "title slug difficulty")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return submissions;
    } catch (error) {
      console.error("Get user submissions error:", error);
      throw error;
    }
  }

  /**
   * Get submissions by question
   */
  async getSubmissionsByQuestion(questionId, options = {}) {
    try {
      const { limit = 100, userId } = options;

      const filter = { questionId };
      if (userId) {
        filter.userId = userId;
      }

      const submissions = await Submission.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return submissions;
    } catch (error) {
      console.error("Get question submissions error:", error);
      throw error;
    }
  }

  /**
   * Get recent submissions
   */
  async getRecentSubmissions(limit = 20) {
    try {
      const submissions = await Submission.find()
        .populate("questionId", "title slug difficulty")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return submissions;
    } catch (error) {
      console.error("Get recent submissions error:", error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      const stats = await Submission.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            acceptedSubmissions: {
              $sum: { $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] },
            },
            averageExecutionTime: { $avg: "$executionTime" },
            averageMemoryUsed: { $avg: "$memoryUsed" },
          },
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            acceptedSubmissions: 1,
            acceptanceRate: {
              $cond: [
                { $eq: ["$totalSubmissions", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$acceptedSubmissions", "$totalSubmissions"] },
                    100,
                  ],
                },
              ],
            },
            averageExecutionTime: { $round: ["$averageExecutionTime", 2] },
            averageMemoryUsed: { $round: ["$averageMemoryUsed", 2] },
          },
        },
      ]);

      return (
        stats[0] || {
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          acceptanceRate: 0,
          averageExecutionTime: 0,
          averageMemoryUsed: 0,
        }
      );
    } catch (error) {
      console.error("Get user stats error:", error);
      throw error;
    }
  }

  /**
   * Get question leaderboard
   */
  async getQuestionLeaderboard(questionId, limit = 100) {
    try {
      const leaderboard = await Submission.aggregate([
        {
          $match: {
            questionId: questionId,
            isCorrect: true,
            isCompleted: true,
          },
        },
        {
          $sort: {
            executionTime: 1,
            memoryUsed: 1,
            createdAt: 1,
          },
        },
        {
          $group: {
            _id: "$userId",
            bestSubmission: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: { newRoot: "$bestSubmission" },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            userId: 1,
            userName: "$user.name",
            userEmail: "$user.email",
            executionTime: 1,
            memoryUsed: 1,
            language: 1,
            createdAt: 1,
          },
        },
        {
          $limit: limit,
        },
      ]);

      return leaderboard;
    } catch (error) {
      console.error("Get question leaderboard error:", error);
      throw error;
    }
  }

  /**
   * Convert language name to Judge0 language ID
   */
  getLanguageId(language) {
    const languageMap = {
      javascript: 63, // Node.js
      python: 71, // Python 3
      java: 62, // Java
      cpp: 54, // C++
      c: 50, // C
      csharp: 51, // C#
      go: 60, // Go
      rust: 73, // Rust
      ruby: 72, // Ruby
      php: 68, // PHP
      swift: 83, // Swift
      kotlin: 78, // Kotlin
      typescript: 74, // TypeScript
    };

    return languageMap[language.toLowerCase()] || 71; // Default to Python
  }

  /**
   * Check submission status from Judge0
   */
  async checkSubmissionStatus(token) {
    try {
      const response = await axios.get(
        `${this.judge0Url}/submissions/${token}`,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Check submission status error:", error);
      throw error;
    }
  }
}

export default new SubmissionService();
