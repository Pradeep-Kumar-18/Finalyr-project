/**
 * Centralized Logger for HemoVision AI Backend
 * ==============================================
 * Provides structured, timestamped logging with severity levels.
 * Color-coded output for local development, clean output for production.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const COLORS = {
  DEBUG: '\x1b[36m',   // Cyan
  INFO: '\x1b[32m',    // Green
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  FATAL: '\x1b[35m',   // Magenta
  RESET: '\x1b[0m'
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.DEBUG;

const formatTimestamp = () => {
  return new Date().toISOString();
};

const log = (level, context, message, meta = null) => {
  if (LOG_LEVELS[level] < currentLevel) return;

  const timestamp = formatTimestamp();
  const color = COLORS[level] || COLORS.RESET;
  const reset = COLORS.RESET;

  const prefix = `${color}[${timestamp}] [${level}] [${context}]${reset}`;
  
  if (meta) {
    console.log(`${prefix} ${message}`, typeof meta === 'object' ? JSON.stringify(meta, null, 2) : meta);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

const logger = {
  debug: (context, message, meta) => log('DEBUG', context, message, meta),
  info: (context, message, meta) => log('INFO', context, message, meta),
  warn: (context, message, meta) => log('WARN', context, message, meta),
  error: (context, message, meta) => log('ERROR', context, message, meta),
  fatal: (context, message, meta) => log('FATAL', context, message, meta),

  // Convenience: log request details
  request: (req, context = 'HTTP') => {
    log('INFO', context, `${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 80)
    });
  }
};

module.exports = logger;
