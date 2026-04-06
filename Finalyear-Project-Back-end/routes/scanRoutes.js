const express = require('express');
const { getScans, createScan } = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.get('/', getScans);
router.post('/', upload.single('image'), createScan);

module.exports = router;
