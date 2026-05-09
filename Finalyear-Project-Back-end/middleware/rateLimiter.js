/**
 * In-Memory Rate Limiter (No External Dependencies)
 * ====================================================
 * Protects AI prediction endpoints from being hammered.
 * Limits per-IP request frequency to prevent 429 cascading.
 *
 * NOTE: For multi-instance deployments, replace with Redis-backed limiter.
 */

const logger = require('../utils/logger');

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.clients = new Map();

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.clients) {
        if (now - data.windowStart > this.windowMs * 2) {
          this.clients.delete(key);
        }
      }
    }, 60000);
  }

  isAllowed(key) {
    const now = Date.now();
    const client = this.clients.get(key);

    if (!client || now - client.windowStart > this.windowMs) {
      // New window
      this.clients.set(key, { windowStart: now, count: 1 });
      return true;
    }

    if (client.count < this.maxRequests) {
      client.count++;
      return true;
    }

    return false;
  }

  remaining(key) {
    const client = this.clients.get(key);
    if (!client) return this.maxRequests;
    const now = Date.now();
    if (now - client.windowStart > this.windowMs) return this.maxRequests;
    return Math.max(0, this.maxRequests - client.count);
  }
}

// Scan endpoint limiter: max 3 scans per minute per IP
const scanLimiter = new RateLimiter(60000, 3);

/**
 * Express middleware: rate-limits scan/prediction routes.
 */
const rateLimitScans = (req, res, next) => {
  const clientKey = req.ip || req.connection.remoteAddress || 'unknown';

  if (!scanLimiter.isAllowed(clientKey)) {
    const remaining = scanLimiter.remaining(clientKey);
    logger.warn('RateLimiter', `Rate limit exceeded for ${clientKey}. Remaining: ${remaining}`);
    
    return res.status(429).json({
      success: false,
      error: 'Too many scan requests. Please wait a minute before trying again.',
      retryAfter: 60
    });
  }

  // Set rate limit headers
  res.set('X-RateLimit-Remaining', scanLimiter.remaining(clientKey));
  next();
};

module.exports = { rateLimitScans, RateLimiter };
