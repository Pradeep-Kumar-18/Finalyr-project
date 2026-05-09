/**
 * Retry Utility with Exponential Backoff
 * ========================================
 * Reusable retry logic for any async operation.
 * Supports jitter to prevent thundering herd.
 */

const logger = require('./logger');

/**
 * Retry an async function with exponential backoff + jitter.
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelay - Initial delay in ms (default: 2000)
 * @param {number} options.maxDelay - Maximum delay cap in ms (default: 15000)
 * @param {Function} options.shouldRetry - Predicate: (error) => boolean
 * @param {string} options.context - Logging context label
 * @returns {Promise<*>}
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 2000,
    maxDelay = 15000,
    shouldRetry = () => true,
    context = 'Retry'
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn(attempt);
      if (attempt > 1) {
        logger.info(context, `Succeeded on attempt ${attempt}/${maxRetries}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !shouldRetry(error)) {
        logger.error(context, `Failed after ${attempt} attempt(s): ${error.message}`);
        throw error;
      }

      // Exponential backoff: baseDelay * 2^(attempt-1) + random jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // 0–1s jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      logger.warn(context, `Attempt ${attempt}/${maxRetries} failed (${error.message}). Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if an HTTP error is retryable (429, 502, 503, 504, network errors).
 */
function isRetryableError(error) {
  // Network errors
  if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code)) {
    return true;
  }

  // HTTP retryable status codes
  const status = error.response?.status;
  if ([429, 502, 503, 504].includes(status)) {
    return true;
  }

  return false;
}

module.exports = { retryWithBackoff, isRetryableError };
