// Test file to demonstrate the Judge0 submission API
import axios from "axios";

const API_BASE = "http://localhost:3000/api";

// Sample test data
const submissionData = {
  code: `
#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d", a + b);
    return 0;
}
  `,
  languageId: 54, // C++ (GCC 9.2.0)
  problemId: "test-problem-1",
  userId: "507f1f77bcf86cd799439011", // Sample ObjectId
  testCases: [
    {
      input: "1 2",
      expectedOutput: "3",
    },
    {
      input: "5 7",
      expectedOutput: "12",
    },
    {
      input: "-1 1",
      expectedOutput: "0",
    },
  ],
};

async function testSubmission() {
  try {
    console.log("Submitting code for evaluation...");

    // Submit code
    const submitResponse = await axios.post(
      `${API_BASE}/submissions`,
      submissionData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Submission response:", submitResponse.data);
    const submissionId = submitResponse.data.submissionId;

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      try {
        const resultResponse = await axios.get(
          `${API_BASE}/submissions/${submissionId}`
        );
        const result = resultResponse.data;

        console.log(
          `Attempt ${attempts + 1}: Status = ${result.overallResult}`
        );

        if (result.overallResult !== "pending") {
          console.log("\n=== Final Result ===");
          console.log("Overall Result:", result.overallResult);
          console.log("Status:", result.status);
          console.log("\nTest Cases:");
          result.testCases.forEach((tc, index) => {
            console.log(`  Test ${index + 1}: ${tc.status}`);
            console.log(`    Input: ${tc.input}`);
            console.log(`    Expected: ${tc.expectedOutput}`);
            console.log(`    Actual: ${tc.actualOutput || "N/A"}`);
            if (tc.errorOutput) {
              console.log(`    Error: ${tc.errorOutput}`);
            }
          });
          break;
        }
      } catch (error) {
        console.error(
          "Error fetching result:",
          error.response?.data || error.message
        );
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log("Timeout: Submission took too long to complete");
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

// Run the test
testSubmission();
