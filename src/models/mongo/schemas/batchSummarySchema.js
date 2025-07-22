import mongoose from "mongoose";

/**
 * Batch submission summary schema
 * Contains aggregated results for batch submissions
 */
const batchSummarySchema = new mongoose.Schema(
  {
    totalTestCases: {
      type: Number,
      default: 0,
      min: 0,
      description: "Total number of test cases",
    },
    passedTestCases: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of test cases that passed",
    },
    failedTestCases: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of test cases that failed",
    },
    overallVerdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Partial",
        "Unknown",
        "Pending",
      ],
      default: "Pending",
      description: "Overall verdict for the batch submission",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to calculate success rate
batchSummarySchema.virtual("successRate").get(function () {
  if (this.totalTestCases === 0) return 0;
  return (this.passedTestCases / this.totalTestCases) * 100;
});

// Virtual to check if all test cases passed
batchSummarySchema.virtual("allPassed").get(function () {
  return (
    this.totalTestCases > 0 && this.passedTestCases === this.totalTestCases
  );
});

// Virtual to check if any test cases passed
batchSummarySchema.virtual("anyPassed").get(function () {
  return this.passedTestCases > 0;
});

// Virtual to get formatted success rate
batchSummarySchema.virtual("formattedSuccessRate").get(function () {
  return `${this.successRate.toFixed(1)}%`;
});

export default batchSummarySchema;
