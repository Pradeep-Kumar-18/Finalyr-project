const Scan = require('../models/Scan');
const cnnService = require('../services/cnnService');
const logger = require('../utils/logger');
const { cleanupUploadedFiles } = require('../services/cleanupService');

const CTX = 'ScanController';

// @desc    Get all scans for a user
// @route   GET /api/scans
// @access  Private
exports.getScans = async (req, res, next) => {
  try {
    const scans = await Scan.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: scans.length, data: scans });
  } catch (err) {
    logger.error(CTX, `getScans error: ${err.message}`);
    res.status(500).json({ success: false, error: 'Failed to retrieve scan history.' });
  }
};

// @desc    Create new combined scan (all 3 images: eye, nail, palm)
// @route   POST /api/scans/combined
// @access  Private
exports.createCombinedScan = async (req, res, next) => {
  const requestId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  logger.info(CTX, `[${requestId}] Combined scan started for user ${req.user.id}`);

  try {
    // 1. Validate all 3 images are uploaded
    if (!req.files || !req.files.eye || !req.files.nail || !req.files.palm) {
      logger.warn(CTX, `[${requestId}] Missing images in upload`);
      return res.status(400).json({ 
        success: false, 
        error: 'Please upload all 3 images: eye, nail, and palm' 
      });
    }

    // 2. Log file details
    logger.info(CTX, `[${requestId}] Files received:`, {
      eye: req.files.eye[0]?.originalname,
      nail: req.files.nail[0]?.originalname,
      palm: req.files.palm[0]?.originalname,
      totalSize: `${((req.files.eye[0]?.size || 0) + (req.files.nail[0]?.size || 0) + (req.files.palm[0]?.size || 0)) / 1024}KB`
    });

    // 3. Build image URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const eyeImageUrl = `${baseUrl}/uploads/${req.files.eye[0].filename}`;
    const nailImageUrl = `${baseUrl}/uploads/${req.files.nail[0].filename}`;
    const palmImageUrl = `${baseUrl}/uploads/${req.files.palm[0].filename}`;

    // 4. Call AI service (queued, retried, fail-safe)
    logger.info(CTX, `[${requestId}] Calling AI prediction service...`);
    const predictionStartTime = Date.now();
    const prediction = await cnnService.predictCombined(req.files);
    const predictionDuration = Date.now() - predictionStartTime;
    
    logger.info(CTX, `[${requestId}] AI prediction completed in ${predictionDuration}ms`, {
      label: prediction.label,
      confidence: prediction.confidence,
      isMock: prediction.isMock || false
    });

    // 5. Sanitize all values (prevent NaN/undefined from crashing MongoDB)
    const eyeScore = Number(prediction.eye_score) || 0.5;
    const nailScore = Number(prediction.nail_score) || 0.5;
    const palmScore = Number(prediction.palm_score) || 0.5;
    const finalScore = Number(prediction.final_score) || 0.5;
    const confidence = Number(prediction.confidence) || 85;
    const label = prediction.label || (finalScore >= 0.5 ? 'Normal' : 'Anemia');
    const status = prediction.status || (finalScore >= 0.5 ? 'Normal' : 'Anemic');

    // 6. Save to database
    const scan = await Scan.create({
      user: req.user.id,
      type: 'Combined',
      eyeScore,
      nailScore,
      palmScore,
      finalScore,
      label,
      confidence,
      status,
      eyeImageUrl,
      nailImageUrl,
      palmImageUrl
    });

    logger.info(CTX, `[${requestId}] Scan saved to database: ${scan._id}`);

    // 7. Cleanup uploaded files (async, non-blocking)
    // Schedule cleanup after a short delay to ensure response is sent first
    setTimeout(() => {
      cleanupUploadedFiles(req.files);
    }, 5000);

    // 8. Return structured response
    res.status(201).json({ 
      success: true, 
      data: scan,
      meta: {
        processingTime: predictionDuration,
        isMock: prediction.isMock || false
      }
    });

  } catch (err) {
    logger.error(CTX, `[${requestId}] Combined scan FAILED: ${err.message}`, err.stack);
    
    // Cleanup files even on error
    cleanupUploadedFiles(req.files);

    // NEVER return raw error messages to the client
    const statusCode = err.status || 500;
    res.status(statusCode).json({ 
      success: false, 
      error: 'Analysis could not be completed. Please try again.',
      requestId // Include for debugging
    });
  }
};

// @desc    Create single scan (one image type) - backward compatibility
// @route   POST /api/scans
// @access  Private
exports.createScan = async (req, res, next) => {
  try {
    const { type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image' });
    }

    const imageUrl = req.file.path;
    
    const typeMap = {
      'Palm': 'palm',
      'Conjunctiva': 'eye',
      'Nail Bed': 'nail'
    };

    const modelType = typeMap[type] || type.toLowerCase();
    logger.info(CTX, `Single scan: type=${modelType}, file=${req.file.originalname}`);
    
    const prediction = await cnnService.predictSingle(req.file.path, modelType);

    const scan = await Scan.create({
      user: req.user.id,
      type,
      finalScore: Number(prediction.score) || 0.5,
      label: prediction.label || 'Normal',
      confidence: Number(prediction.confidence) || 85,
      imageUrl,
      status: prediction.label === 'Normal' ? 'Normal' : (prediction.score >= 0.3 ? 'Anemic' : 'Critical')
    });

    logger.info(CTX, `Single scan saved: ${scan._id}`);
    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    logger.error(CTX, `Single scan error: ${err.message}`);
    res.status(500).json({ success: false, error: 'Scan failed. Please try again.' });
  }
};
