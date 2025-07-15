 import axios from "axios";

// In-memory store for submissions (token -> metadata)
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
  const { code, languageId, stdin, expectedOutput, testcases } = req.body;
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

  const singleUrl = `${process.env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`;
  const batchUrl = `${process.env.JUDGE0_BASE_URL}/submissions/batch?base64_encoded=false&wait=false`;
  const hasBatch = Array.isArray(testcases) && testcases.length > 0;
  let tokens = [];

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
    tokens = Array.isArray(data) ? data.map((r) => r.token) : data.tokens || [];
    if (tokens.length === 0) {
      return res.status(500).json({ error: "No tokens returned from Judge0" });
    }
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
    submissions.set(token, {
      expectedOutput,
      createdAt: new Date(),
      status: "In Queue",
    });
  }
  return res.status(200).json({ tokens });
}

// GET /submissions/:token
export async function getSubmission(req, res) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  const record = submissions.get(token);
  if (!record) {
    return res.status(404).json({ error: "Submission not found" });
  }
  if (record.completedAt) {
    return res.json({ token, ...record });
  }
  const url = `${process.env.JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`;
  const resp = await axios.get(url);
  const data = resp.data;
  const { stdout = "", stderr = "", status } = data;
  const statusDesc = (status && status.description) || "Unknown";
  const updated = { ...record, status: statusDesc, stdout, stderr };
  if (statusDesc !== "In Queue" && statusDesc !== "Processing") {
    let verdict = statusDesc;
    if (statusDesc === "Accepted" && record.expectedOutput !== undefined) {
      verdict =
        stdout.trim() === record.expectedOutput.trim()
          ? "Accepted"
          : "Wrong Answer";
    }
    updated.verdict = verdict;
    updated.completedAt = new Date();
  }
  submissions.set(token, updated);
  return res.json({ token, ...updated });
}

// GET /submissions
export function getAllSubmissions(req, res) {
  const list = Array.from(submissions.entries()).map(([token, data]) => ({
    token,
    ...data,
  }));
  res.json({ total: list.length, submissions: list });
}

// POST /submissions/callback
export function handleCallback(req, res) {
  const { token, stdout = "", stderr = "", status } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required in callback" });
  }
  if (!submissions.has(token)) {
    return res.status(400).json({ error: "Invalid or unknown token" });
  }
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
    completedAt: new Date(),
  });
  res.sendStatus(200);
}
