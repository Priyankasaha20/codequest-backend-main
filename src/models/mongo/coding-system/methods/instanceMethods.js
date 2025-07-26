/**
 * Instance methods for the Submission model
 * These methods are called on individual submission documents
 */

/**
 * Update submission status with Judge0 response data
 * @param {Object} statusData - Response data from Judge0
 * @returns {Promise<Submission>} Updated submission document
 */
export function updateStatus(statusData) {
  this.status = statusData.status || this.status;
  this.stdout = statusData.stdout || this.stdout;
  this.stderr = statusData.stderr || this.stderr;
  this.executionTime = statusData.time || this.executionTime;
  this.memoryUsed = statusData.memory || this.memoryUsed;
  this.compileOutput = statusData.compile_output || this.compileOutput;

  if (statusData.finished_at) {
    this.judge0Data.finishedAt = new Date(statusData.finished_at);
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  // Calculate verdict for single submissions
  if (
    this.submissionType === "single" &&
    this.status.description === "Accepted"
  ) {
    this.verdict =
      this.stdout?.trim() === this.expectedOutput?.trim()
        ? "Accepted"
        : "Wrong Answer";
  } else if (this.status.description !== "Accepted") {
    this.verdict = this.status.description;
  }

  return this.save();
}

/**
 * Update batch submission with multiple test case results
 * @param {Array} results - Array of Judge0 response objects
 * @returns {Promise<Submission>} Updated submission document
 */
export function updateBatchResults(results) {
  this.testCases = results.map((result, index) => ({
    ...this.testCases[index]?.toObject(),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status,
    verdict:
      result.status?.description === "Accepted"
        ? result.stdout?.trim() ===
          this.testCases[index]?.expectedOutput?.trim()
          ? "Accepted"
          : "Wrong Answer"
        : result.status?.description || "Unknown",
    executionTime: result.time,
    memoryUsed: result.memory,
  }));

  // Update batch summary
  this.batchSummary.totalTestCases = this.testCases.length;
  this.batchSummary.passedTestCases = this.testCases.filter(
    (tc) => tc.verdict === "Accepted"
  ).length;
  this.batchSummary.failedTestCases =
    this.batchSummary.totalTestCases - this.batchSummary.passedTestCases;

  // Determine overall verdict
  if (this.batchSummary.passedTestCases === this.batchSummary.totalTestCases) {
    this.batchSummary.overallVerdict = "Accepted";
  } else if (this.batchSummary.passedTestCases === 0) {
    this.batchSummary.overallVerdict = this.testCases[0]?.verdict || "Unknown";
  } else {
    this.batchSummary.overallVerdict = "Partial";
  }

  this.verdict = this.batchSummary.overallVerdict;
  this.isCompleted = true;
  this.completedAt = new Date();

  return this.save();
}

/**
 * Mark submission as failed with error message
 * @param {string} errorMessage - Error description
 * @returns {Promise<Submission>} Updated submission document
 */
export function markAsFailed(errorMessage) {
  this.errorMessage = errorMessage;
  this.verdict = "Runtime Error";
  this.status = { id: 12, description: "Runtime Error (Other)" };
  this.isCompleted = true;
  this.completedAt = new Date();

  return this.save();
}

/**
 * Increment retry count
 * @returns {Promise<Submission>} Updated submission document
 */
export function incrementRetry() {
  this.retryCount += 1;
  return this.save();
}

/**
 * Check if submission can be retried
 * @returns {boolean} Whether submission can be retried
 */
export function canRetry() {
  return this.retryCount < 3 && !this.isCompleted;
}

/**
 * Get submission summary for API responses
 * @returns {Object} Simplified submission data
 */
export function getSummary() {
  return {
    id: this._id,
    tokens: this.tokens,
    userId: this.userId,
    language: this.language,
    submissionType: this.submissionType,
    verdict: this.verdict,
    status: this.status.description,
    executionTime: this.executionTime,
    memoryUsed: this.memoryUsed,
    problemId: this.problemId,
    contestId: this.contestId,
    createdAt: this.createdAt,
    completedAt: this.completedAt,
    isCompleted: this.isCompleted,
    batchSummary:
      this.submissionType === "batch" ? this.batchSummary : undefined,
  };
}

/**
 * Check if submission is successful
 * @returns {boolean} Whether submission was accepted
 */
export function isSuccessful() {
  return this.verdict === "Accepted";
}

/**
 * Get execution performance metrics
 * @returns {Object} Performance data
 */
export function getPerformanceMetrics() {
  return {
    executionTime: this.executionTime,
    memoryUsed: this.memoryUsed,
    wallTime: this.judge0Data?.wallTime,
    cpuTime: this.judge0Data?.cpuTime,
    processingTime: this.judge0Data?.processingTime,
  };
}

export default {
  updateStatus,
  updateBatchResults,
  markAsFailed,
  incrementRetry,
  canRetry,
  getSummary,
  isSuccessful,
  getPerformanceMetrics,
};
