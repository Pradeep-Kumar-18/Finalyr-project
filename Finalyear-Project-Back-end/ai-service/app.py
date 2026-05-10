"""
HemoVision AI - Flask Inference API (Production Optimized v3)
=============================================================
FIXES in v3:
- MEMORY STABILIZATION: Strict garbage collection after every inference.
- SEQUENTIAL OPTIMIZATION: Optimized for one-at-a-time processing.
- WARMUP: Performs dummy inference at startup to avoid first-run lag.
- ROBUSTNESS: Enhanced error handling and health checks.
"""

import os
import sys
import gc
import time
import threading
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import traceback

# ========================
# Environment Configuration
# ========================
# Memory Optimization for Render Free Tier (512MB RAM)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Minimal logging
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)

app = Flask(__name__)
CORS(app)

# ========================
# Global State & Config
# ========================
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
IMG_SIZE = (224, 224)
inference_lock = threading.Lock()

# Global Model References
models = {
    'eye': None,
    'nail': None,
    'palm': None
}

# ========================
# Model Loader
# ========================
def load_all_models():
    print("\n" + "=" * 50)
    print("[HemoAI] INITIALIZING MODELS...")
    print("=" * 50)
    
    model_paths = {
        'eye': 'eye_model_final.h5',
        'nail': 'nail_model_final.h5',
        'palm': 'palm_model_final.h5'
    }

    for key, filename in model_paths.items():
        path = os.path.join(MODEL_DIR, filename)
        if not os.path.exists(path):
            print(f"[ERROR] Missing model file: {filename}")
            continue
        
        try:
            start = time.time()
            print(f"[*] Loading {key} model...")
            models[key] = load_model(path, compile=False) # Compile=False saves memory
            print(f"[OK] {key} model loaded in {time.time()-start:.2f}s")
        except Exception as e:
            print(f"[FAIL] {key} model load error: {str(e)}")

    # Warmup inference to initialize TensorFlow graph
    warmup_models()
    gc.collect()
    print("=" * 50)
    print("[HemoAI] SYSTEM READY")
    print("=" * 50 + "\n")

def warmup_models():
    """Run a dummy inference on all loaded models to 'warm' them up."""
    print("[*] Performing model warmup...")
    dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
    for key, model in models.items():
        if model:
            try:
                model.predict(dummy_input, verbose=0)
                print(f"  - {key} warmup complete")
            except:
                pass
    print("[OK] Warmup finished.")

# ========================
# Image Preprocessing
# ========================
def preprocess_image(img_file):
    try:
        img = Image.open(img_file).convert("RGB")
        img = img.resize(IMG_SIZE)
        img_array = np.array(img, dtype=np.float32)
        del img
        img_array = preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"[PREPROCESS ERROR] {str(e)}")
        return None

# ========================
# Routes
# ========================

@app.route("/health", methods=["GET"])
def health():
    """Health check for Render and Backend."""
    status = "healthy" if all(models.values()) else "partial"
    return jsonify({
        "status": status,
        "models": {k: (v is not None) for k, v in models.items()},
        "memory_info": "Memory-optimized v3"
    }), 200

@app.route("/predict/single", methods=["POST"])
def predict_single():
    """
    Core prediction endpoint. 
    Processes ONE image with ONE model to save memory.
    """
    if not inference_lock.acquire(timeout=60):
        return jsonify({"error": "Inference service busy"}), 503

    try:
        # 1. Validate Input
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        
        scan_type = request.form.get('type', '').lower()
        if scan_type not in models or models[scan_type] is None:
            return jsonify({"error": f"Model for '{scan_type}' not available"}), 400

        img_file = request.files['image']
        
        # 2. Preprocess
        img_array = preprocess_image(img_file)
        if img_array is None:
            return jsonify({"error": "Image processing failed"}), 422

        # 3. Predict
        start_time = time.time()
        prediction = models[scan_type].predict(img_array, verbose=0)[0][0]
        duration = time.time() - start_time

        # 4. Cleanup
        del img_array
        gc.collect()

        score = float(prediction)
        label = "Normal" if score >= 0.5 else "Anemia"
        confidence = round(abs(score - 0.5) * 200, 1)

        print(f"[AI] {scan_type.upper()} prediction: {score:.4f} ({duration:.2f}s)")

        return jsonify({
            "score": score,
            "label": label,
            "confidence": min(confidence, 100.0),
            "type": scan_type
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Internal AI error", "details": str(e)}), 500
    finally:
        inference_lock.release()

@app.route("/predict-combined", methods=["POST"])
def predict_combined_legacy():
    """
    DEPRECATED: Now handled by Node.js sequentially calling /predict/single.
    Kept as a proxy to /predict/single logic if needed, but discouraged for memory.
    """
    return jsonify({"error": "Use sequential /predict/single calls to prevent OOM"}), 400

@app.route("/", methods=["GET"])
def home():
    return jsonify({"service": "HemoVision AI", "version": "3.0.0-production"})

# ========================
# Main Entry Point
# ========================
if __name__ == "__main__":
    # Load models before starting server
    load_all_models()
    
    port = int(os.environ.get("PORT", 5001))
    # Threaded=True allows concurrent requests, but inference_lock serializes AI work
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
