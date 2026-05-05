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

    // Build image URLs using local server path
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const eyeImageUrl = `${baseUrl}/uploads/${req.files.eye[0].filename}`;
    const nailImageUrl = `${baseUrl}/uploads/${req.files.nail[0].filename}`;
    const palmImageUrl = `${baseUrl}/uploads/${req.files.palm[0].filename}`;

    // Call Flask AI service with all 3 images
    const prediction = await cnnService.predictCombined(req.files);

    if (!prediction) {
      throw new Error('AI Service returned no data');
    }

    // Ensure all scores are valid numbers (prevent NaN)
    const eyeScore = Number(prediction.eye_score) || 0.5;
    const nailScore = Number(prediction.nail_score) || 0.5;
    const palmScore = Number(prediction.palm_score) || 0.5;
    const finalScore = Number(prediction.final_score) || 0.5;
    const confidence = Number(prediction.confidence) || 85;

    // Save combined scan to database
    const scan = await Scan.create({
      user: req.user.id,
      type: 'Combined',
      eyeScore,
      nailScore,
      palmScore,
      finalScore,
      label: prediction.label || (finalScore >= 0.5 ? 'Normal' : 'Anemia'),
      confidence,
      status: prediction.status || (finalScore >= 0.5 ? 'Normal' : 'Anemic'),
      eyeImageUrl,
      nailImageUrl,
      palmImageUrl
    });

    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    console.error('--- Combined Scan Controller Error ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Analysis failed. Please try again or check server logs.',
      details: err.message
    });
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

    const imageUrl = req.file.path;
    
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
