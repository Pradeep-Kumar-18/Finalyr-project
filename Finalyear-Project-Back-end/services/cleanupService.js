/**
 * File Cleanup Service
 * =====================
 * Deletes uploaded temporary files after AI processing completes.
 * Prevents disk space exhaustion on Render free tier.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Delete a single file safely (non-blocking, non-throwing).
 * @param {string} filePath - Absolute path to file
 */
const deleteFile = (filePath) => {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Cleanup', `Deleted: ${path.basename(filePath)}`);
    }
  } catch (err) {
    logger.warn('Cleanup', `Failed to delete ${filePath}: ${err.message}`);
  }
};

/**
 * Delete all uploaded files from a multer req.files object.
 * Supports both single file (req.file) and multi-field (req.files).
 * 
 * @param {Object} files - req.files from multer (fields mode)
 */
const cleanupUploadedFiles = (files) => {
  if (!files) return;

  try {
    // Multi-field format: { eye: [file], nail: [file], palm: [file] }
    for (const fieldName of Object.keys(files)) {
      const fileArray = files[fieldName];
      if (Array.isArray(fileArray)) {
        fileArray.forEach(file => deleteFile(file.path));
      }
    }
    logger.debug('Cleanup', 'All uploaded files cleaned up');
  } catch (err) {
    logger.warn('Cleanup', `Cleanup error: ${err.message}`);
  }
};

/**
 * Periodic cleanup: delete files older than maxAgeMs from uploads directory.
 * @param {number} maxAgeMs - Max file age in ms (default: 30 minutes)
 */
const cleanupOldUploads = (maxAgeMs = 30 * 60 * 1000) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');

  try {
    if (!fs.existsSync(uploadsDir)) return;

    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    let cleaned = 0;

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (e) {
        // Skip files that can't be accessed
      }
    });

    if (cleaned > 0) {
      logger.info('Cleanup', `Periodic cleanup: removed ${cleaned} old upload(s)`);
    }
  } catch (err) {
    logger.warn('Cleanup', `Periodic cleanup error: ${err.message}`);
  }
};

/**
 * Start periodic cleanup timer (runs every 15 minutes).
 */
const startPeriodicCleanup = () => {
  // Initial cleanup on startup
  setTimeout(() => cleanupOldUploads(), 5000);
  
  // Then every 15 minutes
  setInterval(() => cleanupOldUploads(), 15 * 60 * 1000);
  logger.info('Cleanup', 'Periodic file cleanup service started (every 15 min)');
};

module.exports = { deleteFile, cleanupUploadedFiles, cleanupOldUploads, startPeriodicCleanup };
