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

// @desc    Create new scan (CNN integration)
// @route   POST /api/scans
// @access  Private
exports.createScan = async (req, res, next) => {
  try {
    const { type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Call CNN model bridge
    const prediction = await cnnService.predictHb(req.file.path);

    // Save scan to database
    const scan = await Scan.create({
      user: req.user.id,
      type,
      hb: prediction.hb,
      confidence: prediction.confidence,
      imageUrl,
      status: prediction.hb >= 12 ? 'Normal' : prediction.hb >= 10 ? 'Anemic' : 'Critical'
    });

    res.status(201).json({ success: true, data: scan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
