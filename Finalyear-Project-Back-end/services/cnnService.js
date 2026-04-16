/**
 * CNN Model Bridge
 * This service handles the communication between the Express backend
 * and the Python Flask AI inference service.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';
const { Readable } = require('stream');

/**
 * Helper to get an image stream from either a local path or a remote URL
 */
const getImageStream = async (filePath) => {
  if (filePath.startsWith('http')) {
    const response = await axios.get(filePath, { responseType: 'stream' });
    return response.data;
  }
  return fs.createReadStream(filePath);
};

/**
 * Combined prediction using all 3 models (eye, nail, palm).
 * Sends all 3 images to the Flask API and returns combined results.
 * 
 * @param {Object} files - Object with eye, nail, palm file objects from multer
 * @returns {Object} - Prediction result with scores, label, confidence, status
 */
exports.predictCombined = async (files) => {
  try {
    const formData = new FormData();

    // Append each image file to the form data
    if (files.eye && files.eye[0]) {
      const eyeStream = await getImageStream(files.eye[0].path);
      formData.append('eye', eyeStream, {
        filename: files.eye[0].originalname || 'eye.jpg',
        contentType: files.eye[0].mimetype
      });
    }

    if (files.nail && files.nail[0]) {
      const nailStream = await getImageStream(files.nail[0].path);
      formData.append('nail', nailStream, {
        filename: files.nail[0].originalname || 'nail.jpg',
        contentType: files.nail[0].mimetype
      });
    }

    if (files.palm && files.palm[0]) {
      const palmStream = await getImageStream(files.palm[0].path);
      formData.append('palm', palmStream, {
        filename: files.palm[0].originalname || 'palm.jpg',
        contentType: files.palm[0].mimetype
      });
    }

    console.log(`Sending images to Flask API at ${FLASK_API_URL}/predict...`);

    const response = await axios.post(`${FLASK_API_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 second timeout for model inference
    });

    console.log('Flask API Response:', response.data);

    return response.data;

  } catch (error) {
    console.error('CNN Service Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI Service is not running. Please start the Python Flask server (ai-service/app.py) on port 5001.');
    }

    if (error.response) {
      throw new Error(`AI Service Error: ${error.response.data.error || error.response.statusText}`);
    }

    throw new Error(`Failed to get prediction: ${error.message}`);
  }
};

/**
 * Single image prediction (for individual scans).
 * 
 * @param {string} imagePath - Path to the uploaded image
 * @param {string} type - Scan type ('eye', 'nail', 'palm')
 * @returns {Object} - Prediction result with score, label, confidence
 */
exports.predictSingle = async (imagePath, type) => {
  try {
    const imageStream = await getImageStream(imagePath);
    formData.append('image', imageStream);
    formData.append('type', type);

    console.log(`Sending single ${type} image to Flask API...`);

    const response = await axios.post(`${FLASK_API_URL}/predict/single`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000
    });

    console.log('Single Prediction Response:', response.data);

    return response.data;

  } catch (error) {
    console.error('CNN Service Error (single):', error.message);

    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI Service is not running. Please start the Python Flask server on port 5001.');
    }

    if (error.response) {
      throw new Error(`AI Service Error: ${error.response.data.error || error.response.statusText}`);
    }

    throw new Error(`Failed to get prediction: ${error.message}`);
  }
};