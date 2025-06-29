import axios from "axios";
import { TestCase } from "../models/submissions.js";

const JUDGE0_URL = process.env.JUDGE0_API_URL; // e.g. https://judge0.com

export const submitAndStore = async (submissionId, testCase) => {
  try {
    // Create test case in database first
    const newTestCase = new TestCase({
      submissionId,
      problemId: testCase.problemId,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      languageId: testCase.languageId,
      submissionCode: testCase.submissionCode,
      status: "processing",
    });

    await newTestCase.save();

    // Prepare payload for Judge0
    const payload = {
      source_code: testCase.submissionCode,
      language_id: testCase.languageId,
      stdin: testCase.input,
      expected_output: testCase.expectedOutput,
      callback_url: `${process.env.API_URL}/api/judge0-webhook`,
    };

    // Submit to Judge0
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      payload,
      {
        headers: {
          "X-Auth-Token": process.env.JUDGE0_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    // Store the Judge0 token for callback identification
    if (response.data && response.data.token) {
      await TestCase.findByIdAndUpdate(newTestCase._id, {
        judge0Token: response.data.token,
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error submitting to Judge0:", error);
    // Update test case status to failed
    await TestCase.findByIdAndUpdate(newTestCase._id, {
      status: "runtime_error",
      errorOutput: error.message,
    });
    throw error;
  }
};
