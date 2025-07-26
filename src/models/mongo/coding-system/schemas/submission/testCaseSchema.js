import mongoose from "mongoose";
import statusSchema from "./statusSchema.js";

/**
 * Test case schema for batch submissions
 * Each test case contains input, expected output, and execution results
 */
const testCaseSchema = new mongoose.Schema(
  {
    stdin: {
      type: String,
      default: "",
      description: "Input data for this test case",
    },
    expectedOutput: {
      type: String,
      required: true,
      description: "Expected output for this test case",
    },
    stdout: {
      type: String,
      default: "",
      description: "Actual output from code execution",
    },
    stderr: {
      type: String,
      default: "",
      description: "Error output from code execution",
    },
    status: {
      type: statusSchema,
      description: "Execution status for this test case",
    },
    verdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Unknown",
      ],
      default: "Unknown",
      description: "Final verdict for this test case",
    },
    executionTime: {
      type: Number, // in milliseconds
      default: null,
      description: "Time taken to execute this test case",
    },
    memoryUsed: {
      type: Number, // in KB
      default: null,
      description: "Memory consumed during execution",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if test case passed
testCaseSchema.virtual("passed").get(function () {
  return this.verdict === "Accepted";
});

// Virtual to check if test case failed
testCaseSchema.virtual("failed").get(function () {
  return this.verdict !== "Accepted" && this.verdict !== "Unknown";
});

// Virtual to get formatted execution time
testCaseSchema.virtual("formattedTime").get(function () {
  if (!this.executionTime) return "N/A";
  if (this.executionTime < 1000) return `${this.executionTime}ms`;
  return `${(this.executionTime / 1000).toFixed(2)}s`;
});

// Virtual to get formatted memory usage
testCaseSchema.virtual("formattedMemory").get(function () {
  if (!this.memoryUsed) return "N/A";
  if (this.memoryUsed < 1024) return `${this.memoryUsed}KB`;
  return `${(this.memoryUsed / 1024).toFixed(2)}MB`;
});

export default testCaseSchema;
