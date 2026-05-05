/**
 * CNN Model Bridge
 * Optimized for Render Free Tier to avoid 429 Too Many Requests.
 * Processes predictions sequentially with delays and retries.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

/**
 * Helper to delay execution
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to get an image stream
 */
const getImageStream = async (filePath) => {
  if (filePath.startsWith('http')) {
    const response = await axios.get(filePath, { responseType: 'stream' });
    return response.data;
  }
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return fs.createReadStream(filePath);
};

/**
 * Robust API caller with Retry Logic for 429 errors
 */
const callFlaskWithRetry = async (formData, endpoint, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(`${FLASK_API_URL}${endpoint}`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 30000 // 30s timeout
      });
      return response.data;
    } catch (error) {
      const isRateLimit = error.response && error.response.status === 429;
      const isLastRetry = i === retries - 1;

      if (isRateLimit && !isLastRetry) {
        console.warn(`Rate limit (429) hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
        continue;
      }
      
      // If it's a connection error or we're out of retries, throw it
      throw error;
    }
  }
};

/**
 * SEQUENTIAL Combined prediction logic
 * Calls eye -> nail -> palm one by one with delays.
 */
exports.predictCombined = async (files) => {
  try {
    if (!files.eye || !files.nail || !files.palm) {
      throw new Error('Please upload all 3 images: eye, nail, and palm');
    }

    console.log('--- Starting Sequential AI Analysis ---');
    
    // 1. Process Eye
    const eyeFormData = new FormData();
    eyeFormData.append('image', await getImageStream(files.eye[0].path));
    eyeFormData.append('type', 'eye');
    const eyeRes = await callFlaskWithRetry(eyeFormData, '/predict/single');
    console.log('Eye analysis complete');

    await sleep(1500); // Wait 1.5s to let Render breathe

    // 2. Process Nail
    const nailFormData = new FormData();
    nailFormData.append('image', await getImageStream(files.nail[0].path));
    nailFormData.append('type', 'nail');
    const nailRes = await callFlaskWithRetry(nailFormData, '/predict/single');
    console.log('Nail analysis complete');

    await sleep(1500); // Wait 1.5s again

    // 3. Process Palm
    const palmFormData = new FormData();
    palmFormData.append('image', await getImageStream(files.palm[0].path));
    palmFormData.append('type', 'palm');
    const palmRes = await callFlaskWithRetry(palmFormData, '/predict/single');
    console.log('Palm analysis complete');

    // 4. Aggregate Results (Node.js handles the logic now)
    const eye_score = eyeRes.score;
    const nail_score = nailRes.score;
    const palm_score = palmRes.score;
    const final_score = (eye_score + nail_score + palm_score) / 3.0;

    const label = final_score < 0.5 ? 'Anemia' : 'Normal';
    const confidence = Math.round(Math.abs(final_score - 0.5) * 200);
    
    let status = 'Normal';
    if (label === 'Anemia') {
      status = final_score >= 0.3 ? 'Anemic' : 'Critical';
    }

    console.log(`--- Analysis Success: ${label} (${confidence}%) ---`);

    return {
      eye_score: Number(eye_score.toFixed(4)),
      nail_score: Number(nail_score.toFixed(4)),
      palm_score: Number(palm_score.toFixed(4)),
      final_score: Number(final_score.toFixed(4)),
      label,
      confidence,
      status
    };

  } catch (error) {
    console.error('CNN Service Error:', error.message);
    
    // Final Fallback: Return Mock if service is completely down
    if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
      console.warn('Using fallback mock data due to AI service unavailability');
      return this.getMockPrediction();
    }
    
    throw new Error(error.response?.data?.error || error.message);
  }
};

/**
 * Fallback Mock Data
 */
exports.getMockPrediction = () => {
  const eye = 0.35 + Math.random() * 0.4;
  const nail = 0.35 + Math.random() * 0.4;
  const palm = 0.35 + Math.random() * 0.4;
  const final = (eye + nail + palm) / 3;
  return {
    eye_score: eye, nail_score: nail, palm_score: palm, final_score: final,
    label: final >= 0.5 ? 'Normal' : 'Anemia',
    confidence: Math.round(Math.abs(final - 0.5) * 200),
    status: final >= 0.5 ? 'Normal' : (final >= 0.35 ? 'Anemic' : 'Critical'),
    isMock: true
  };
};

/**
 * Individual scan (backward compatibility)
 */
exports.predictSingle = async (imagePath, type) => {
  const formData = new FormData();
  formData.append('image', await getImageStream(imagePath));
  formData.append('type', type);
  return await callFlaskWithRetry(formData, '/predict/single');
};