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

    // 4. Call AI service (Sequential, Queued, Retried)
    logger.info(CTX, `[${requestId}] Calling AI sequential service...`);
    const predictionStartTime = Date.now();
    
    // This now runs Eye -> Wait -> Palm -> Wait -> Nail
    const prediction = await cnnService.predictCombined(req.files);
    
    const predictionDuration = Date.now() - predictionStartTime;
    
    logger.info(CTX, `[${requestId}] AI Analysis completed in ${predictionDuration}ms`, {
      label: prediction.label,
      confidence: prediction.confidence
    });

    // 5. Sanitize and Validate Values
    const eyeScore = Number(prediction.eye_score) || 0;
    const nailScore = Number(prediction.nail_score) || 0;
    const palmScore = Number(prediction.palm_score) || 0;
    const finalScore = Number(prediction.final_score) || 0;
    const confidence = Number(prediction.confidence) || 0;
    const label = prediction.label || 'Unknown';
    const status = prediction.status || 'Unknown';

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

    logger.info(CTX, `[${requestId}] Scan result saved: ${scan._id}`);

    // 7. Immediate cleanup of local files after DB save
    cleanupUploadedFiles(req.files);

    // 8. Return response
    res.status(201).json({ 
      success: true, 
      data: scan,
      meta: {
        processingTime: predictionDuration,
        queuePosition: 0
      }
    });

  } catch (err) {
    logger.error(CTX, `[${requestId}] Combined scan CRITICAL FAILURE: ${err.message}`);
    
    // Ensure cleanup even on crash
    if (req.files) cleanupUploadedFiles(req.files);

    // Provide meaningful error to frontend
    const errorMsg = err.message.includes('AI Service') 
      ? 'AI Analysis service is busy or starting up. Please try again in 1 minute.'
      : 'Analysis failed due to a server error. Please try again.';

    res.status(err.status || 500).json({ 
      success: false, 
      error: errorMsg,
      requestId 
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
