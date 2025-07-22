/**
 * Static methods for the Submission model
 * These methods are called on the model itself, not on instances
 */

/**
 * Find submission by Judge0 token
 * @param {string} token - Judge0 submission token
 * @returns {Promise<Submission|null>} Submission document or null
 */
export function findByToken(token) {
  return this.findOne({ tokens: token });
}

/**
 * Find submissions by user ID with pagination
 * @param {number} userId - PostgreSQL user ID
 * @param {number} limit - Maximum number of submissions to return
 * @returns {Promise<Array>} Array of submission documents
 */
export function findByUserId(userId, limit = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
}

/**
 * Find submissions by problem ID
 * @param {string} problemId - Problem identifier
 * @param {number|null} userId - Optional user ID filter
 * @returns {Promise<Array>} Array of submission documents
 */
export function findByProblem(problemId, userId = null) {
  const query = { problemId };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
}

/**
 * Get submission statistics for a user
 * @param {number} userId - PostgreSQL user ID
 * @returns {Promise<Array>} Aggregation results with verdict counts
 */
export function getSubmissionStats(userId) {
  return this.aggregate([
    { $match: { userId, isCompleted: true } },
    {
      $group: {
        _id: "$verdict",
        count: { $sum: 1 },
      },
    },
  ]);
}

/**
 * Get recent submissions across all users
 * @param {number} limit - Number of submissions to return
 * @returns {Promise<Array>} Array of recent submissions
 */
export function getRecentSubmissions(limit = 20) {
  return this.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("userId tokens language verdict status createdAt problemId");
}

/**
 * Get submissions by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} userId - Optional user ID filter
 * @returns {Promise<Array>} Array of submissions in date range
 */
export function getSubmissionsByDateRange(startDate, endDate, userId = null) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };
  if (userId) query.userId = userId;

  return this.find(query).sort({ createdAt: -1 });
}

/**
 * Get top performers for a problem
 * @param {string} problemId - Problem identifier
 * @param {number} limit - Number of top performers to return
 * @returns {Promise<Array>} Array of top submissions
 */
export function getTopPerformers(problemId, limit = 10) {
  return this.find({
    problemId,
    verdict: "Accepted",
    isCompleted: true,
    executionTime: { $ne: null },
  })
    .sort({ executionTime: 1, createdAt: 1 })
    .limit(limit)
    .select("userId executionTime memoryUsed language createdAt");
}

/**
 * Count submissions by status
 * @param {number} userId - Optional user ID filter
 * @returns {Promise<Array>} Status count aggregation
 */
export function countByStatus(userId = null) {
  const matchStage = userId ? { userId } : {};

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status.description",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
}

export default {
  findByToken,
  findByUserId,
  findByProblem,
  getSubmissionStats,
  getRecentSubmissions,
  getSubmissionsByDateRange,
  getTopPerformers,
  countByStatus,
};
