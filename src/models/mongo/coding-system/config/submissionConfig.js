/**
 * Apply indexes to the submission schema
 * @param {mongoose.Schema} schema - The submission schema
 */
export function applyIndexes(schema) {
  // Primary indexes for common queries
  schema.index({ userId: 1, createdAt: -1 }); // User submissions by date
  schema.index({ "status.description": 1 }); // Filter by status
  schema.index({ verdict: 1 }); // Filter by verdict
  schema.index({ isCompleted: 1, createdAt: -1 }); // Completed submissions

  // Problem and contest specific indexes
  schema.index({ problemId: 1, userId: 1 });
  schema.index({ problemId: 1, verdict: 1, executionTime: 1 });

  // Performance optimization indexes
  schema.index({ userId: 1, verdict: 1 }); // User statistics
  schema.index({ createdAt: -1 }); // Recent submissions
  schema.index({ problemId: 1, createdAt: -1 }); // Problem submissions by date

  // Compound indexes for analytics
  schema.index({
    "language.id": 1,
    verdict: 1,
    createdAt: -1,
  }); // Language-specific statistics

  schema.index({
    submissionType: 1,
    isCompleted: 1,
    createdAt: -1,
  }); // Submission type analytics
}

/**
 * Apply virtual fields to the submission schema
 * @param {mongoose.Schema} schema - The submission schema
 */
export function applyVirtuals(schema) {
  // Virtual for getting submission duration
  schema.virtual("duration").get(function () {
    if (this.completedAt && this.createdAt) {
      return this.completedAt.getTime() - this.createdAt.getTime();
    }
    return null;
  });

  // Virtual for formatted duration
  schema.virtual("formattedDuration").get(function () {
    const duration = this.duration;
    if (!duration) return "N/A";
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  });

  // Virtual for formatted execution time
  schema.virtual("formattedExecutionTime").get(function () {
    if (!this.executionTime) return "N/A";
    if (this.executionTime < 1000) return `${this.executionTime}ms`;
    return `${(this.executionTime / 1000).toFixed(2)}s`;
  });

  // Virtual for formatted memory usage
  schema.virtual("formattedMemoryUsed").get(function () {
    if (!this.memoryUsed) return "N/A";
    if (this.memoryUsed < 1024) return `${this.memoryUsed}KB`;
    return `${(this.memoryUsed / 1024).toFixed(2)}MB`;
  });

  // Virtual to check if submission is pending
  schema.virtual("isPending").get(function () {
    return ["In Queue", "Processing"].includes(this.status?.description);
  });

  // Virtual to check if submission has error
  schema.virtual("hasError").get(function () {
    return this.errorMessage && this.errorMessage.length > 0;
  });
}

/**
 * Apply middleware to the submission schema
 * @param {mongoose.Schema} schema - The submission schema
 */
export function applyMiddleware(schema) {
  // Pre-save middleware to update batch summary
  schema.pre("save", function (next) {
    // Update batch summary if test cases exist
    if (this.submissionType === "batch" && this.testCases.length > 0) {
      this.batchSummary.totalTestCases = this.testCases.length;
      this.batchSummary.passedTestCases = this.testCases.filter(
        (tc) => tc.verdict === "Accepted"
      ).length;
      this.batchSummary.failedTestCases =
        this.batchSummary.totalTestCases - this.batchSummary.passedTestCases;
    }
    next();
  });

  // Pre-save middleware to set completion status
  schema.pre("save", function (next) {
    if (this.status && this.status.isCompleted && !this.isCompleted) {
      this.isCompleted = true;
      if (!this.completedAt) {
        this.completedAt = new Date();
      }
    }
    next();
  });

  // Post-save middleware for logging (optional)
  schema.post("save", function (doc) {
    if (doc.isCompleted && doc.wasNew) {
      console.log(
        `Submission ${doc.tokens[0]} completed with verdict: ${doc.verdict}`
      );
    }
  });

  // Pre-remove middleware for cleanup
  schema.pre("remove", function (next) {
    console.log(`Removing submission ${this.tokens[0]}`);
    next();
  });
}

export default {
  applyIndexes,
  applyVirtuals,
  applyMiddleware,
};
