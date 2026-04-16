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
    // Validate all 3 images are uploaded
    if (!req.files || !req.files.eye || !req.files.nail || !req.files.palm) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please upload all 3 images: eye, nail, and palm' 
      });
    }

    // Build image URLs
    const eyeImageUrl = `/uploads/${req.files.eye[0].filename}`;
    const nailImageUrl = `/uploads/${req.files.nail[0].filename}`;
    const palmImageUrl = `/uploads/${req.files.palm[0].filename}`;

    // Call Flask AI service with all 3 images
    const prediction = await cnnService.predictCombined(req.files);

    // Save combined scan to database
    const scan = await Scan.create({
      user: req.user.id,
      type: 'Combined',
      eyeScore: prediction.eye_score,
      nailScore: prediction.nail_score,
      palmScore: prediction.palm_score,
      finalScore: prediction.final_score,
      label: prediction.label,
      confidence: prediction.confidence,
      status: prediction.status,
      eyeImageUrl,
      nailImageUrl,
      palmImageUrl
    });

    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    console.error('Combined Scan Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create single scan (one image type) - kept for backward compatibility
// @route   POST /api/scans
// @access  Private
exports.createScan = async (req, res, next) => {
  try {
    const { type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Map frontend type names to model type names
    const typeMap = {
      'Palm': 'palm',
      'Conjunctiva': 'eye',
      'Nail Bed': 'nail'
    };

    const modelType = typeMap[type] || type.toLowerCase();

    // Call Flask AI service for single prediction
    const prediction = await cnnService.predictSingle(req.file.path, modelType);

    // Save scan to database
    const scan = await Scan.create({
      user: req.user.id,
      type,
      finalScore: prediction.score,
      label: prediction.label,
      confidence: prediction.confidence,
      imageUrl,
      status: prediction.label === 'Normal' ? 'Normal' : prediction.score >= 0.3 ? 'Anemic' : 'Critical'
    });

    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    console.error('Single Scan Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};
