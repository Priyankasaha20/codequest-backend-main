import { TestCase, Submission } from "../models/submissions.js";

export const handleWebhook = async (req, res) => {
  try {
    const { token, status_id, stdout, stderr, compile_output } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    // Find the test case by Judge0 token
    const testCase = await TestCase.findOne({ judge0Token: token });

    if (!testCase) {
      console.error(`No test case found for token: ${token}`);
      return res.status(404).json({ error: "Test case not found" });
    }

    // Map Judge0 status codes to our status
    const statusMap = {
      1: "pending", // In Queue
      2: "processing", // Processing
      3: "accepted", // Accepted
      4: "wrong_answer", // Wrong Answer
      5: "time_limit_exceeded", // Time Limit Exceeded
      6: "compilation_error", // Compilation Error
      7: "runtime_error", // Runtime Error (SIGSEGV)
      8: "runtime_error", // Runtime Error (SIGXFSZ)
      9: "runtime_error", // Runtime Error (SIGFPE)
      10: "runtime_error", // Runtime Error (SIGABRT)
      11: "runtime_error", // Runtime Error (NZEC)
      12: "runtime_error", // Runtime Error (Other)
      13: "runtime_error", // Internal Error
      14: "runtime_error", // Exec Format Error
    };

    const mappedStatus = statusMap[status_id] || "runtime_error";

    // Update the test case
    await TestCase.findByIdAndUpdate(testCase._id, {
      status: mappedStatus,
      actualOutput: stdout || "",
      errorOutput: stderr || compile_output || "",
    });

    // Check if all test cases for this submission are completed
    const allTestCases = await TestCase.find({
      submissionId: testCase.submissionId,
    });
    const completedTestCases = allTestCases.filter(
      (tc) => tc.status !== "pending" && tc.status !== "processing"
    );

    if (completedTestCases.length === allTestCases.length) {
      // All test cases completed, update submission status
      const allAccepted = allTestCases.every((tc) => tc.status === "accepted");
      const overallResult = allAccepted ? "accepted" : "wrong_answer";

      await Submission.findByIdAndUpdate(testCase.submissionId, {
        status: "completed",
        overallResult,
      });
    }

    console.log(`Webhook processed for token ${token}: ${mappedStatus}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
