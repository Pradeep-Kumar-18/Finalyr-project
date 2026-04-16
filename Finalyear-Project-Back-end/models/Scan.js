const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Palm', 'Conjunctiva', 'Nail Bed', 'Combined'],
    default: 'Combined'
  },
  // Individual model scores (0-1 range, closer to 1 = Normal)
  eyeScore: {
    type: Number,
    default: null
  },
  nailScore: {
    type: Number,
    default: null
  },
  palmScore: {
    type: Number,
    default: null
  },
  // Combined average score
  finalScore: {
    type: Number,
    default: null
  },
  // Prediction label: "Anemia" or "Normal"
  label: {
    type: String,
    enum: ['Anemia', 'Normal'],
    default: 'Normal'
  },
  // Legacy field - kept for backward compatibility
  hb: {
    type: Number,
    default: 0
  },
  spo2: {
    type: Number,
    default: 98
  },
  confidence: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Normal', 'Anemic', 'Critical'],
    default: 'Normal'
  },
  // Image URLs for all 3 uploads
  eyeImageUrl: String,
  nailImageUrl: String,
  palmImageUrl: String,
  // Legacy single image URL
  imageUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scan', scanSchema);
