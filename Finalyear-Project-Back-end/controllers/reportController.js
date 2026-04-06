const Report = require('../models/Report');
const Scan = require('../models/Scan');

// @desc    Get user reports
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create/Generate report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res, next) => {
  try {
    const { reportNumber, scanIds, weightedHb, confidence, recommendation } = req.body;

    const report = await Report.create({
      user: req.user.id,
      reportNumber,
      scans: scanIds,
      weightedHb,
      confidence,
      recommendation
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
