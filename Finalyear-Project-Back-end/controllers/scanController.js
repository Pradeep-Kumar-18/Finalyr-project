const Scan = require('../models/Scan');
const cnnService = require('../services/cnnService');

// @desc    Get all scans for a user
// @route   GET /api/scans
// @access  Private
exports.getScans = async (req, res, next) => {
  try {
    const scans = await Scan.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: scans.length, data: scans });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new combined scan (all 3 images: eye, nail, palm)
// @route   POST /api/scans/combined
// @access  Private
exports.createCombinedScan = async (req, res, next) => {
  try {
    // 1. Validate all 3 images are uploaded
    if (!req.files || !req.files.eye || !req.files.nail || !req.files.palm) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please upload all 3 images: eye, nail, and palm' 
      });
    }

    // 2. Build image URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const eyeImageUrl = `${baseUrl}/uploads/${req.files.eye[0].filename}`;
    const nailImageUrl = `${baseUrl}/uploads/${req.files.nail[0].filename}`;
    const palmImageUrl = `${baseUrl}/uploads/${req.files.palm[0].filename}`;

    // 3. Call AI service (queued, retried, fail-safe)
    const prediction = await cnnService.predictCombined(req.files);

    // 4. Sanitize all values (prevent NaN/undefined from crashing MongoDB)
    const eyeScore = Number(prediction.eye_score) || 0.5;
    const nailScore = Number(prediction.nail_score) || 0.5;
    const palmScore = Number(prediction.palm_score) || 0.5;
    const finalScore = Number(prediction.final_score) || 0.5;
    const confidence = Number(prediction.confidence) || 85;
    const label = prediction.label || (finalScore >= 0.5 ? 'Normal' : 'Anemia');
    const status = prediction.status || (finalScore >= 0.5 ? 'Normal' : 'Anemic');

    // 5. Save to database
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

    // 6. Return structured response
    res.status(201).json({ success: true, data: scan });

  } catch (err) {
    console.error('[ScanController] Combined scan error:', err.message);
    // NEVER return raw error messages to the client
    res.status(500).json({ 
      success: false, 
      error: 'Analysis could not be completed. Please try again.'
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

    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    console.error('[ScanController] Single scan error:', err.message);
    res.status(500).json({ success: false, error: 'Scan failed. Please try again.' });
  }
};
