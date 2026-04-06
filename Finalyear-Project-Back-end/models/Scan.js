const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Palm', 'Conjunctiva', 'Nail Bed'],
    required: true
  },
  hb: {
    type: Number,
    required: true
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
  imageUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scan', scanSchema);
