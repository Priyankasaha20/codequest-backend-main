import Bull from "bull";
import { submitAndStore } from "./judge0.js";

const runTestQueue = new Bull(
  "run-tests",
  process.env.REDIS_URL || "redis://localhost:6379"
);

runTestQueue.process("runTest", async (job) => {
  try {
    const { submissionId, testCase } = job.data;
    // Call Judge0 and store the submission
    await submitAndStore(submissionId, testCase);
  } catch (error) {
    console.error("Queue processing error:", error);
    throw error;
  }
});

// Handle job events
runTestQueue.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

runTestQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

export default runTestQueue;
