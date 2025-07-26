import mongoose from "mongoose";

/**
 * Problem statistics schema
 * Tracks submission and success rates for problems
 */
const problemStatsSchema = new mongoose.Schema(
  {
    totalSubmissions: {
      type: Number,
      default: 0,
      min: 0,
      description: "Total number of submissions for this problem",
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of accepted submissions",
    },
    uniqueUsers: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of unique users who submitted solutions",
    },
    averageExecutionTime: {
      type: Number,
      default: null,
      description: "Average execution time in milliseconds",
    },
    lastSubmissionAt: {
      type: Date,
      default: null,
      description: "Timestamp of the last submission",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to calculate acceptance rate
problemStatsSchema.virtual("acceptanceRate").get(function () {
  if (this.totalSubmissions === 0) return 0;
  return Number(
    ((this.acceptedSubmissions / this.totalSubmissions) * 100).toFixed(2)
  );
});

// Virtual to check if problem is popular
problemStatsSchema.virtual("isPopular").get(function () {
  return this.totalSubmissions > 100;
});

// Virtual to get formatted average execution time
problemStatsSchema.virtual("formattedAvgTime").get(function () {
  if (!this.averageExecutionTime) return "N/A";
  if (this.averageExecutionTime < 1000) return `${this.averageExecutionTime}ms`;
  return `${(this.averageExecutionTime / 1000).toFixed(2)}s`;
});

export default problemStatsSchema;
