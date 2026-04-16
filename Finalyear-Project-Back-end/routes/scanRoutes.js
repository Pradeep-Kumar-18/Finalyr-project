const express = require('express');
const { getScans, createScan, createCombinedScan } = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get all scans
router.get('/', getScans);

// Single image scan (backward compatibility)
router.post('/', upload.single('image'), createScan);

// Combined 3-image scan (eye + nail + palm)
router.post('/combined', upload.fields([
  { name: 'eye', maxCount: 1 },
  { name: 'nail', maxCount: 1 },
  { name: 'palm', maxCount: 1 }
]), createCombinedScan);

module.exports = router;
