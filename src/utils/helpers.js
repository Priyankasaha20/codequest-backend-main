/**
 * HTTP status codes constants
 */
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Standard API response format
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {object} data - Response data
 * @param {object} error - Error details
 */
export const sendResponse = (
  res,
  statusCode,
  message,
  data = null,
  error = null
) => {
  const response = {
    success: statusCode < 400,
    message,
    ...(data && { data }),
    ...(error && { error }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Standard success response
 */
export const sendSuccess = (
  res,
  message,
  data = null,
  statusCode = STATUS_CODES.OK
) => {
  return sendResponse(res, statusCode, message, data);
};

/**
 * Standard error response
 */
export const sendError = (
  res,
  message,
  statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR,
  error = null
) => {
  return sendResponse(res, statusCode, message, null, error);
};

/**
 * Generates a random string for tokens, etc.
 * @param {number} length
 * @returns {string}
 */
export const generateRandomString = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Validates MongoDB ObjectId format
 * @param {string} id
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Creates a delay for rate limiting or testing
 * @param {number} ms
 * @returns {Promise}
 */
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
