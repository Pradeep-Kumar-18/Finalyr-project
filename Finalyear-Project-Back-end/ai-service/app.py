"""
HemoVision AI - Flask Inference API (Production Optimized v2)
=============================================================
FIXES in v2:
- Added per-client request throttling (prevents 429 from burst requests)
- Added request queue with semaphore (max 1 concurrent inference)
- Added detailed request timing logs
- Added memory-efficient image processing with explicit cleanup
- Optimized for Render free tier (1 worker, 2 threads)
- Thread-safe inference with threading.Lock
- Single combined endpoint to avoid multiple requests
"""

import os
import sys
import subprocess

# ========================
# Dependency Validation Guard
# ========================
REQUIRED_PACKAGES = {
    'numpy': 'numpy',
    'flask': 'flask',
    'flask_cors': 'flask-cors',
    'tensorflow': 'tensorflow',
    'PIL': 'pillow'
}

def validate_dependencies():
    missing = []
    for module, package in REQUIRED_PACKAGES.items():
        try:
            __import__(module)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"\n[!] CRITICAL ERROR: Missing required packages: {', '.join(missing)}")
        print("[*] Attempting to fix environment...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
            print("[OK] Successfully installed missing packages. Please restart the app.")
            sys.exit(0)
        except Exception as e:
            print(f"[ERROR] Auto-installation failed: {e}")
            print(f"[*] Please run: pip install -r requirements.txt")
            sys.exit(1)

validate_dependencies()

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
from collections import defaultdict

# ========================
# Memory Optimization for Render Free Tier
# ========================
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TF warnings

app = Flask(__name__)
CORS(app)

# ========================
# Configuration
# ========================
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
IMG_SIZE = (224, 224)

# Thread lock to prevent concurrent model access (race conditions)
inference_lock = threading.Lock()

# ========================
# Request Throttling (Per-Client Rate Limiting)
# ========================
class RequestThrottler:
    """Limits requests per client IP to prevent 429 cascading."""
    def __init__(self, max_per_minute=3):
        self.max_per_minute = max_per_minute
        self.requests = defaultdict(list)
        self._lock = threading.Lock()
    
    def is_allowed(self, client_ip):
        with self._lock:
            now = time.time()
            # Clean old entries
            self.requests[client_ip] = [
                t for t in self.requests[client_ip] if now - t < 60
            ]
            if len(self.requests[client_ip]) >= self.max_per_minute:
                return False
            self.requests[client_ip].append(now)
            return True

throttler = RequestThrottler(max_per_minute=5)

# ========================
# Request Queue (Semaphore-based)
# ========================
# Only allow 1 inference at a time (prevents OOM on free tier)
inference_semaphore = threading.Semaphore(1)

# ========================
# Load Models ONCE at Startup (Global Scope)
# ========================
print("\n" + "=" * 50)
print("[HemoAI] SYSTEM INITIALIZATION")
print(f"[HemoAI] Model Directory: {MODEL_DIR}")
print("=" * 50)

# Check if model directory exists and has files
if not os.path.exists(MODEL_DIR):
    print(f"[CRITICAL] Model directory NOT FOUND: {MODEL_DIR}")
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("[HemoAI] Created empty models directory. Please upload .h5 files.")

model_files = [f for f in os.listdir(MODEL_DIR) if f.endswith('.h5')]
print(f"[HemoAI] Found {len(model_files)} model files: {model_files}")

eye_model = None
nail_model = None
palm_model = None

def load_hemo_model(name, filename):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        print(f"[ERROR] {name} model file MISSING: {filename}")
        return None
    try:
        start = time.time()
        print(f"[*] Loading {name} model...")
        model = load_model(path)
        print(f"[OK] {name} loaded in {time.time()-start:.2f}s")
        return model
    except Exception as e:
        print(f"[FAIL] {name} failed: {str(e)}")
        return None

eye_model = load_hemo_model("Eye", "eye_model_final.h5")
nail_model = load_hemo_model("Nail", "nail_model_final.h5")
palm_model = load_hemo_model("Palm", "palm_model_final.h5")

# Force garbage collection after model loading
gc.collect()

print("=" * 50)
print("[HemoAI] SERVICE STATUS: " + ("READY" if all([eye_model, nail_model, palm_model]) else "PARTIAL/OFFLINE"))
print("=" * 50 + "\n")

def preprocess_image(img_file):
    """Preprocess uploaded image for MobileNetV2 inference."""
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

def safe_predict(model, img_file):
    """Thread-safe prediction on a single image."""
    if model is None:
        raise ValueError("Model not loaded")
    img_array = preprocess_image(img_file)
    if img_array is None:
        raise ValueError("Image preprocessing failed")
    prediction = model.predict(img_array, verbose=0)[0][0]
    del img_array
    gc.collect() # Aggressive cleanup
    return float(prediction)


# ========================
# Core Routes
# ========================

@app.route("/", methods=["GET"])
def home():
    """Root route to confirm service is running."""
    return jsonify({
        "message": "HemoVision AI Inference Service",
        "status": "online",
        "endpoints": ["/", "/health", "/predict-combined", "/predict/single"],
        "models_ready": all([eye_model, nail_model, palm_model])
    })

@app.route("/health", methods=["GET"])
def health_check():
    """Standard health check for Render/K8s."""
    status = "healthy" if all([eye_model, nail_model, palm_model]) else "partial"
    return jsonify({
        "status": status,
        "models": {
            "eye": eye_model is not None,
            "nail": nail_model is not None,
            "palm": palm_model is not None
        },
        "uptime": round(time.time(), 2)
    })


# ========================
# COMBINED Prediction Endpoint (Single Request, Sequential Processing)
# This is the PRIMARY endpoint. Node.js sends ONE request with all 3 images.
# ========================
@app.route("/predict-combined", methods=["POST"])
def predict_combined():
    """
    Accepts 3 images (eye, nail, palm) in a SINGLE request.
    Processes them SEQUENTIALLY inside the lock to prevent race conditions.
    Returns all scores in one response.
    """
    start_time = time.time()
    client_ip = request.remote_addr or "unknown"

    # Rate limit check
    if not throttler.is_allowed(client_ip):
        print(f"[THROTTLE] Rate limit exceeded for {client_ip}")
        return jsonify({"error": "Too many requests. Please wait before trying again."}), 429

    # Try to acquire semaphore (non-blocking with timeout)
    acquired = inference_semaphore.acquire(timeout=60)
    if not acquired:
        print(f"[QUEUE] Request from {client_ip} timed out waiting for semaphore")
        return jsonify({"error": "Server busy. Please try again in a moment."}), 503

    try:
        # Validate images
        missing = []
        for key in ["eye", "nail", "palm"]:
            if key not in request.files:
                missing.append(key)
        if missing:
            return jsonify({"error": f"Missing images: {', '.join(missing)}"}), 400

        # Validate models
        if not all([eye_model, nail_model, palm_model]):
            return jsonify({"error": "AI models not loaded"}), 503

        eye_file = request.files["eye"]
        nail_file = request.files["nail"]
        palm_file = request.files["palm"]

        # Acquire inference lock: only ONE prediction runs at a time (thread-safe)
        with inference_lock:
            print(f"[AI] Processing combined prediction for {client_ip} (locked)...")

            # Sequential: Eye → Nail → Palm (with timing)
            t1 = time.time()
            eye_score = safe_predict(eye_model, eye_file)
            print(f"  Eye score: {eye_score:.4f} ({time.time()-t1:.2f}s)")

            t2 = time.time()
            nail_score = safe_predict(nail_model, nail_file)
            print(f"  Nail score: {nail_score:.4f} ({time.time()-t2:.2f}s)")

            t3 = time.time()
            palm_score = safe_predict(palm_model, palm_file)
            print(f"  Palm score: {palm_score:.4f} ({time.time()-t3:.2f}s)")

        # Aggregate (outside lock to free it faster)
        final_score = (eye_score + nail_score + palm_score) / 3.0
        label = "Normal" if final_score >= 0.5 else "Anemia"
        confidence = round(abs(final_score - 0.5) * 200, 1)

        if label == "Normal":
            status = "Normal"
        elif final_score >= 0.3:
            status = "Anemic"
        else:
            status = "Critical"

        result = {
            "eye_score": round(eye_score, 4),
            "nail_score": round(nail_score, 4),
            "palm_score": round(palm_score, 4),
            "final_score": round(final_score, 4),
            "label": label,
            "confidence": confidence,
            "status": status
        }

        total_time = time.time() - start_time
        print(f"[AI] Result: {label} ({confidence}% confidence) — Total: {total_time:.2f}s")

        # Free memory
        gc.collect()

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        gc.collect()
        return jsonify({"error": str(e)}), 500
    finally:
        inference_semaphore.release()


# ========================
# Legacy single prediction endpoint (backward compatibility)
# ========================
@app.route("/predict/single", methods=["POST"])
def predict_single_endpoint():
    client_ip = request.remote_addr or "unknown"

    if not throttler.is_allowed(client_ip):
        return jsonify({"error": "Too many requests"}), 429

    acquired = inference_semaphore.acquire(timeout=30)
    if not acquired:
        return jsonify({"error": "Server busy"}), 503

    try:
        if "image" not in request.files:
            return jsonify({"error": "Missing image file"}), 400

        scan_type = request.form.get("type", "").lower()
        img_file = request.files["image"]

        model_map = {
            "eye": eye_model, "conjunctiva": eye_model,
            "nail": nail_model, "nail bed": nail_model,
            "palm": palm_model
        }

        model = model_map.get(scan_type)
        if model is None:
            return jsonify({"error": f"Invalid scan type: {scan_type}"}), 400

        with inference_lock:
            score = safe_predict(model, img_file)

        label = "Normal" if score >= 0.5 else "Anemia"
        confidence = round(abs(score - 0.5) * 200, 1)

        gc.collect()
        return jsonify({"score": round(score, 4), "label": label, "confidence": confidence})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        inference_semaphore.release()


# ========================
# Legacy combined endpoint (kept for backward compatibility)
# ========================
@app.route("/predict", methods=["POST"])
def predict_legacy():
    return predict_combined()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"\n[HemoAI] Inference server starting on port {port}")
    print(f"[HemoAI] Model directory: {MODEL_DIR}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
