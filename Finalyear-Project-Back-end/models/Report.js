const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  reportNumber: {
    type: String,
    required: true,
    unique: true
  },
  scans: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Scan'
  }],
  weightedHb: Number,
  confidence: Number,
  recommendation: String,
  pdfUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
