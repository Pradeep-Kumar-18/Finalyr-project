const express = require('express');
const { getScans, createScan, createCombinedScan } = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { rateLimitScans } = require('../middleware/rateLimiter');
const timeoutMiddleware = require('../middleware/timeoutMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get all scans
router.get('/', getScans);

// Single image scan (backward compatibility)
router.post('/', upload.single('image'), createScan);

// Combined 3-image scan (eye + nail + palm)
// Protected by: auth → rate limit → timeout → file upload → controller
router.post('/combined',
  rateLimitScans,                         // Max 3 scans/min per IP
  timeoutMiddleware(150000),              // 2.5 min timeout for AI inference
  upload.fields([
    { name: 'eye', maxCount: 1 },
    { name: 'nail', maxCount: 1 },
    { name: 'palm', maxCount: 1 }
  ]),
  createCombinedScan
);

module.exports = router;
