import { Submission, TestCase } from "../models/submissions.js";
import Queue from "../services/queue.js";

export const submitCode = async (req, res, next) => {
  try {
    const { code, languageId, problemId, userId, testCases } = req.body;

    // Validate required fields
    if (
      !code ||
      !languageId ||
      !problemId ||
      !userId ||
      !testCases ||
      !testCases.length
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: code, languageId, problemId, userId, testCases",
      });
    }

    // 1) Create submission
    const submission = new Submission({
      code,
      languageId,
      problemId,
      userId,
      status: "processing",
    });

    await submission.save();

    // 2) Enqueue jobs for each test case
    const jobs = testCases.map((testCase, index) => {
      return Queue.add(
        "runTest",
        {
          submissionId: submission._id,
          testCase: {
            problemId,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            languageId,
            submissionCode: code,
          },
        },
        {
          delay: index * 100, // Small delay between submissions to avoid overwhelming Judge0
        }
      );
    });

    await Promise.all(jobs);

    res.json({
      submissionId: submission._id,
      status: submission.status,
      message: "Submission queued for processing",
    });
  } catch (error) {
    console.error("Submit code error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id).populate({
      path: "testCases",
      model: "TestCase",
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Get all test cases for this submission
    const testCases = await TestCase.find({ submissionId: submission._id });

    // Calculate overall status
    if (testCases.length === 0) {
      submission.overallResult = "pending";
    } else if (
      testCases.some(
        (tc) => tc.status === "pending" || tc.status === "processing"
      )
    ) {
      submission.overallResult = "pending";
    } else if (testCases.every((tc) => tc.status === "accepted")) {
      submission.overallResult = "accepted";
    } else {
      submission.overallResult = "wrong_answer";
    }

    await submission.save();

    res.json({
      ...submission.toObject(),
      testCases,
    });
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
