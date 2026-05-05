/**
 * CNN Model Bridge
 * This service handles the communication between the Express backend
 * and the Python Flask AI inference service.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

/**
 * Helper to get an image stream from either a local path or a remote URL
 */
const getImageStream = async (filePath) => {
  if (filePath.startsWith('http')) {
    const response = await axios.get(filePath, { responseType: 'stream' });
    return response.data;
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.createReadStream(filePath);
};

/**
 * Mock prediction logic for when AI service is unavailable
 */
const getMockPrediction = () => {
  // Generate slightly random but realistic scores
  const eye = 0.35 + Math.random() * 0.4;
  const nail = 0.35 + Math.random() * 0.4;
  const palm = 0.35 + Math.random() * 0.4;
  const final = (eye + nail + palm) / 3;
  
  return {
    eye_score: eye,
    nail_score: nail,
    palm_score: palm,
    final_score: final,
    label: final >= 0.5 ? 'Normal' : 'Anemia',
    confidence: Math.round(Math.abs(final - 0.5) * 200),
    status: final >= 0.5 ? 'Normal' : (final >= 0.35 ? 'Anemic' : 'Critical'),
    isMock: true
  };
};

/**
 * Combined prediction using all 3 models (eye, nail, palm).
 */
exports.predictCombined = async (files) => {
  try {
    const formData = new FormData();

    // Check if files exist
    if (!files.eye || !files.nail || !files.palm) {
      throw new Error('Missing one or more required images');
    }

    // Append each image file to the form data
    const eyeStream = await getImageStream(files.eye[0].path);
    formData.append('eye', eyeStream, {
      filename: files.eye[0].originalname || 'eye.jpg',
      contentType: files.eye[0].mimetype
    });

    const nailStream = await getImageStream(files.nail[0].path);
    formData.append('nail', nailStream, {
      filename: files.nail[0].originalname || 'nail.jpg',
      contentType: files.nail[0].mimetype
    });

    const palmStream = await getImageStream(files.palm[0].path);
    formData.append('palm', palmStream, {
      filename: files.palm[0].originalname || 'palm.jpg',
      contentType: files.palm[0].mimetype
    });

    console.log(`Sending images to Flask API at ${FLASK_API_URL}/predict...`);

    const response = await axios.post(`${FLASK_API_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 15000 // 15 second timeout
    });

    return response.data;

  } catch (error) {
    console.error('CNN Service Error:', error.message);

    // Treat any connection error or service error as a trigger for Mock Mode
    // This includes ECONNREFUSED, timeouts, and 429 (Too Many Requests)
    console.warn('AI Service issue detected. Using Mock Prediction for demonstration.');
    return getMockPrediction();
  }
};

/**
 * Single image prediction (for individual scans).
 */
exports.predictSingle = async (imagePath, type) => {
  try {
    const formData = new FormData();
    const imageStream = await getImageStream(imagePath);
    formData.append('image', imageStream);
    formData.append('type', type);

    console.log(`Sending single ${type} image to Flask API...`);

    const response = await axios.post(`${FLASK_API_URL}/predict/single`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 10000
    });

    return response.data;

  } catch (error) {
    console.error('CNN Service Error (single):', error.message);

    const score = 0.4 + Math.random() * 0.3;
    return {
      score: score,
      label: score >= 0.5 ? 'Normal' : 'Anemia',
      confidence: Math.round(Math.abs(score - 0.5) * 200),
      isMock: true
    };
  }
};