import axios from "axios";
import SubmissionService from "../services/submissionService.js";

// In-memory store for submissions (token -> metadata) - kept for backward compatibility
export const submissions = new Map();

// Cleanup old submissions periodically
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [token, record] of submissions.entries()) {
    if (now - record.createdAt.getTime() > MAX_SUBMISSION_AGE) {
      submissions.delete(token);
    }
  }
}, CLEANUP_INTERVAL);

// Validate submission input
function validateSubmissionInput(
  code,
  languageId,
  stdin,
  expectedOutput,
  testcases
) {
  if (!code || typeof code !== "string") {
    return "code must be a non-empty string";
  }
  if (code.length > 65536) {
    return "code length exceeds maximum limit (65536 characters)";
  }
  if (!Number.isInteger(languageId) || languageId < 1) {
    return "languageId must be a positive integer";
  }

  const hasSingle = stdin !== undefined && expectedOutput !== undefined;
  const hasBatch = Array.isArray(testcases) && testcases.length > 0;
  if (!hasSingle && !hasBatch) {
    return "either stdin/expectedOutput or testcases array are required";
  }
  if (hasBatch) {
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      if (!tc || typeof tc !== "object") {
        return `testcase at index ${i} must be an object`;
      }
      if (tc.stdin === undefined || tc.expectedOutput === undefined) {
        return `testcase at index ${i} must have stdin and expectedOutput properties`;
      }
    }
  }
  return null;
}

// POST /submit-code
export async function submitCode(req, res) {
  const {
    code,
    languageId,
    stdin,
    expectedOutput,
    testcases,
    problemId,
    contestId,
  } = req.body;
  const validationError = validateSubmissionInput(
    code,
    languageId,
    stdin,
    expectedOutput,
    testcases
  );
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Get user ID from session/auth (assuming req.user.id exists)
  const userId = req.user?.id || req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "User authentication required" });
  }

  const singleUrl = `${process.env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`;
  const batchUrl = `${process.env.JUDGE0_BASE_URL}/submissions/batch?base64_encoded=false&wait=false`;
  const hasBatch = Array.isArray(testcases) && testcases.length > 0;
  let tokens = [];

  try {
    if (hasBatch) {
      const batchData = testcases.map((tc) => ({
        source_code: code,
        language_id: languageId,
        stdin: tc.stdin,
        ...(process.env.JUDGE0_CALLBACK_URL && {
          callback_url: process.env.JUDGE0_CALLBACK_URL,
        }),
      }));
      const resp = await axios.post(batchUrl, batchData, {
        headers: { "Content-Type": "application/json" },
      });
      const data = resp.data;
      tokens = Array.isArray(data)
        ? data.map((r) => r.token)
        : data.tokens || [];
      if (tokens.length === 0) {
        return res
          .status(500)
          .json({ error: "No tokens returned from Judge0" });
      }

      // Store in memory for backward compatibility
      tokens.forEach((token, idx) =>
        submissions.set(token, {
          expectedOutput: testcases[idx].expectedOutput,
          createdAt: new Date(),
          status: "In Queue",
        })
      );
    } else {
      const submissionData = {
        source_code: code,
        language_id: languageId,
        stdin,
        ...(process.env.JUDGE0_CALLBACK_URL && {
          callback_url: process.env.JUDGE0_CALLBACK_URL,
        }),
      };
      const resp = await axios.post(singleUrl, submissionData, {
        headers: { "Content-Type": "application/json" },
      });
      const { token } = resp.data;
      if (!token) {
        return res.status(500).json({ error: "No token returned from Judge0" });
      }
      tokens = [token];

      // Store in memory for backward compatibility
      submissions.set(token, {
        expectedOutput,
        createdAt: new Date(),
        status: "In Queue",
      });
    }

    // Save to MongoDB
    try {
      await SubmissionService.createSubmission({
        userId,
        code,
        languageId,
        stdin,
        expectedOutput,
        testcases,
        tokens,
        problemId,
        contestId,
      });
    } catch (mongoError) {
      console.error("Failed to save submission to MongoDB:", mongoError);
      // Continue with the response even if MongoDB fails
    }

    return res.status(200).json({ tokens });
  } catch (error) {
    console.error("Submit code error:", error);
    return res.status(500).json({ error: "Failed to submit code to Judge0" });
  }
}

// GET /submissions/:token
export async function getSubmission(req, res) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // First try to get from MongoDB
    let mongoSubmission = await SubmissionService.getSubmissionByToken(token);

    // Check in-memory store for backward compatibility
    const record = submissions.get(token);
    if (!record && !mongoSubmission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // If completed in MongoDB, return that data
    if (mongoSubmission && mongoSubmission.isCompleted) {
      return res.json({
        token,
        status: mongoSubmission.status.description,
        verdict: mongoSubmission.verdict,
        stdout: mongoSubmission.stdout,
        stderr: mongoSubmission.stderr,
        executionTime: mongoSubmission.executionTime,
        memoryUsed: mongoSubmission.memoryUsed,
        compileOutput: mongoSubmission.compileOutput,
        createdAt: mongoSubmission.createdAt,
        completedAt: mongoSubmission.completedAt,
        submissionType: mongoSubmission.submissionType,
        testCases: mongoSubmission.testCases,
        batchSummary: mongoSubmission.batchSummary,
      });
    }

    // Check if completed in memory
    if (record && record.completedAt) {
      return res.json({ token, ...record });
    }

    // Fetch from Judge0 API
    const url = `${process.env.JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`;
    const resp = await axios.get(url);
    const data = resp.data;
    const {
      stdout = "",
      stderr = "",
      status,
      time,
      memory,
      compile_output = "",
      finished_at,
    } = data;
    const statusDesc = (status && status.description) || "Unknown";

    const responseData = {
      status: statusDesc,
      stdout,
      stderr,
      executionTime: time,
      memoryUsed: memory,
      compileOutput: compile_output,
      createdAt: record?.createdAt || mongoSubmission?.createdAt || new Date(),
    };

    // Update in-memory store
    const updated = { ...record, ...responseData };
    if (statusDesc !== "In Queue" && statusDesc !== "Processing") {
      let verdict = statusDesc;
      if (
        statusDesc === "Accepted" &&
        (record?.expectedOutput !== undefined ||
          mongoSubmission?.expectedOutput)
      ) {
        const expectedOutput =
          record?.expectedOutput || mongoSubmission?.expectedOutput;
        verdict =
          stdout.trim() === expectedOutput.trim() ? "Accepted" : "Wrong Answer";
      }
      updated.verdict = verdict;
      updated.completedAt = new Date();

      // Update MongoDB
      if (mongoSubmission) {
        try {
          await SubmissionService.updateSubmissionFromJudge0(token, {
            ...data,
            status,
            stdout,
            stderr,
            time,
            memory,
            compile_output,
            finished_at,
          });
        } catch (mongoError) {
          console.error("Failed to update MongoDB submission:", mongoError);
        }
      }
    }

    submissions.set(token, updated);
    return res.json({ token, ...responseData, verdict: updated.verdict });
  } catch (error) {
    console.error("Get submission error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch submission details" });
  }
}

// GET /submissions
export function getAllSubmissions(req, res) {
  const list = Array.from(submissions.entries()).map(([token, data]) => ({
    token,
    ...data,
  }));
  res.json({ total: list.length, submissions: list });
}

// GET /submissions/user/:userId - Get submissions for a specific user from MongoDB
export async function getUserSubmissions(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, problemId, contestId } = req.query;

    let query = { userId: parseInt(userId) };
    if (problemId) query.problemId = problemId;
    if (contestId) query.contestId = contestId;

    const submissions = await SubmissionService.getSubmissionsByUser(
      parseInt(userId),
      parseInt(limit),
      parseInt(skip)
    );

    const total = await SubmissionService.countUserSubmissions(
      parseInt(userId)
    );

    res.json({
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
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
}

// GET /submissions/stats/:userId - Get submission statistics for a user
export async function getUserStats(req, res) {
  try {
    const { userId } = req.params;
    const stats = await SubmissionService.getUserStats(parseInt(userId));
    res.json(stats);
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
}

// GET /submissions/problem/:problemId - Get submissions for a specific problem
export async function getProblemSubmissions(req, res) {
  try {
    const { problemId } = req.params;
    const { userId } = req.query;

    const submissions = await SubmissionService.getSubmissionsByProblem(
      problemId,
      userId ? parseInt(userId) : null
    );

    res.json({
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
    console.error("Get problem submissions error:", error);
    res.status(500).json({ error: "Failed to fetch problem submissions" });
  }
}

// POST /submissions/callback
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
    // Update MongoDB submission
    const mongoSubmission = await SubmissionService.updateSubmissionFromJudge0(
      token,
      req.body
    );

    // Update in-memory store for backward compatibility
    if (submissions.has(token)) {
      const record = submissions.get(token);
      const desc = (status && status.description) || "Unknown";
      let verdict = desc;
      if (desc === "Accepted" && record.expectedOutput !== undefined) {
        verdict =
          stdout.trim() === record.expectedOutput.trim()
            ? "Accepted"
            : "Wrong Answer";
      }
      submissions.set(token, {
        ...record,
        status: desc,
        stdout,
        stderr,
        verdict,
        executionTime: time,
        memoryUsed: memory,
        compileOutput: compile_output,
        completedAt: new Date(),
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Callback handling error:", error);
    res.sendStatus(500);
  }
}
