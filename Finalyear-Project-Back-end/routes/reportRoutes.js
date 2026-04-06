const express = require('express');
const { getReports, createReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getReports);
router.post('/', createReport);

module.exports = router;
