/**
 * CNN Model Bridge - Production Architecture v5 (Enterprise Grade)
 * =============================================================
 * FIXES in v5:
 * 1. SEQUENTIAL EXECUTION: Eye -> Delay -> Palm -> Delay -> Nail
 * 2. MEMORY SAFETY: Prevents AI service OOM by processing one image at a time.
 * 3. GLOBAL QUEUE: Strictly serializes all users to protect Render resources.
 * 4. ROBUST RETRY: Exponential backoff for network/gateway errors.
 * 5. HEALTH VERIFICATION: Strict pre-check before starting heavy tasks.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');
const { retryWithBackoff, isRetryableError } = require('../utils/retryUtils');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';
const CTX = 'CnnService';

/**
 * Global Async Queue
 * Ensures only ONE combined scan (which is 3 sub-scans) runs at a time globally.
 */
class ProductionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.subScanDelay = 2500; // 2.5s gap between sub-scans for GC
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { task, resolve, reject } = this.queue.shift();
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      // Slight gap before next user's request
      setTimeout(() => this.process(), 2000);
    }
  }

  get size() { return this.queue.length; }
}

const globalAiQueue = new ProductionQueue();

/**
 * Health Check System
 */
const verifyAiHealth = async () => {
  try {
    const res = await axios.get(`${FLASK_API_URL}/health`, { timeout: 15000 });
    return res.data?.status === 'healthy' || res.data?.status === 'partial';
  } catch (err) {
    logger.error(CTX, `AI Health Check Failed: ${err.message}`);
    return false;
  }
};

/**
 * Prediction Core: Sends a single image to Flask
 */
const predictType = async (filePath, type, attempt = 1) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));
  form.append('type', type);

  logger.info(CTX, `[AI-Task] Sending ${type.toUpperCase()} request...`);

  return retryWithBackoff(
    async () => {
      return axios({
        method: 'post',
        url: `${FLASK_API_URL}/predict/single`,
        data: form,
        headers: { ...form.getHeaders() },
        timeout: 90000 // 90s per sub-scan
      });
    },
    {
      maxRetries: 2,
      baseDelay: 5000,
      shouldRetry: (err) => isRetryableError(err) || err.code === 'ECONNABORTED',
      context: `${CTX}:${type}`
    }
  );
};

/**
 * SEQUENTIAL COMBINED PREDICTION
 * Eye -> Wait -> Palm -> Wait -> Nail
 */
const runSequentialAnalysis = async (files) => {
  const startTime = Date.now();
  const results = {};

  try {
    // 1. Eye Analysis
    const eyeRes = await predictType(files.eye[0].path, 'eye');
    results.eye = eyeRes.data;
    logger.info(CTX, `Step 1/3: Eye Analysis Done (${results.eye.score.toFixed(4)})`);

    // Controlled Delay for Flask Garbage Collection
    await new Promise(r => setTimeout(r, 3000));

    // 2. Palm Analysis
    const palmRes = await predictType(files.palm[0].path, 'palm');
    results.palm = palmRes.data;
    logger.info(CTX, `Step 2/3: Palm Analysis Done (${results.palm.score.toFixed(4)})`);

    await new Promise(r => setTimeout(r, 3000));

    // 3. Nail Analysis
    const nailRes = await predictType(files.nail[0].path, 'nail');
    results.nail = nailRes.data;
    logger.info(CTX, `Step 3/3: Nail Analysis Done (${results.nail.score.toFixed(4)})`);

    // 4. Aggregation
    const eyeScore = results.eye.score;
    const nailScore = results.nail.score;
    const palmScore = results.palm.score;
    const finalScore = (eyeScore + nailScore + palmScore) / 3;

    const label = finalScore >= 0.5 ? 'Normal' : 'Anemia';
    const confidence = Math.round(((results.eye.confidence + results.nail.confidence + results.palm.confidence) / 3));

    let status = 'Normal';
    if (finalScore < 0.3) status = 'Critical';
    else if (finalScore < 0.5) status = 'Anemic';

    const duration = Date.now() - startTime;
    logger.info(CTX, `✅ Sequential Analysis Completed in ${duration}ms`);

    return {
      eye_score: eyeScore,
      nail_score: nailScore,
      palm_score: palmScore,
      final_score: finalScore,
      label,
      confidence,
      status,
      processingTime: duration
    };

  } catch (error) {
    logger.error(CTX, `Sequential Analysis FAILED: ${error.message}`);
    throw error; // Let controller handle error response
  }
};

/**
 * EXPORTED: Combined Prediction (Queued)
 */
exports.predictCombined = async (files) => {
  // 1. Health Check
  const isAlive = await verifyAiHealth();
  if (!isAlive) {
    // Try one more time after 5s before giving up
    logger.warn(CTX, 'AI Service seems down, retrying health check in 5s...');
    await new Promise(r => setTimeout(r, 5000));
    if (!(await verifyAiHealth())) {
      throw new Error('AI Service is currently unavailable. Please try again in a few minutes.');
    }
  }

  // 2. Enqueue task
  logger.info(CTX, `Adding request to global queue. Position: ${globalAiQueue.size}`);
  return globalAiQueue.enqueue(() => runSequentialAnalysis(files));
};

/**
 * EXPORTED: Single Prediction (Queued)
 */
exports.predictSingle = async (imagePath, type) => {
  return globalAiQueue.enqueue(async () => {
    const res = await predictType(imagePath, type);
    return res.data;
  });
};

/**
 * Queue Status
 */
exports.getQueueStatus = () => ({
  pending: globalAiQueue.size,
  isProcessing: globalAiQueue.isProcessing,
  serviceUrl: FLASK_API_URL
});