"""
HemoVision AI - Flask Inference API (Production Optimized)
==========================================================
- Loads MobileNetV2 models ONCE at startup (global scope)
- Thread-safe inference with threading.Lock
- Single combined endpoint to avoid multiple requests
- Optimized for Render free tier (1 worker, 2 threads)
- Memory-efficient with garbage collection after each prediction
"""

import os
import gc
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
# Load Models ONCE at Startup (Global Scope)
# ========================
print("=" * 50)
print("[HemoAI] Loading AI Models into memory...")
print("=" * 50)

eye_model = None
nail_model = None
palm_model = None

try:
    eye_model = load_model(os.path.join(MODEL_DIR, "eye_model_final.h5"))
    print("[OK] Eye model loaded")
except Exception as e:
    print(f"[ERROR] Eye model: {e}")

try:
    nail_model = load_model(os.path.join(MODEL_DIR, "nail_model_final.h5"))
    print("[OK] Nail model loaded")
except Exception as e:
    print(f"[ERROR] Nail model: {e}")

try:
    palm_model = load_model(os.path.join(MODEL_DIR, "palm_model_final.h5"))
    print("[OK] Palm model loaded")
except Exception as e:
    print(f"[ERROR] Palm model: {e}")

# Force garbage collection after model loading
gc.collect()

print("=" * 50)
print("[HemoAI] All models loaded. Service ready.")
print("=" * 50)


def preprocess_image(img_file):
    """Preprocess uploaded image for MobileNetV2 inference."""
    img = Image.open(img_file).convert("RGB")
    img = img.resize(IMG_SIZE)
    img_array = np.array(img, dtype=np.float32)
    img_array = preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def safe_predict(model, img_file):
    """Thread-safe prediction on a single image."""
    img_array = preprocess_image(img_file)
    prediction = model.predict(img_array, verbose=0)[0][0]
    del img_array  # Free memory immediately
    return float(prediction)


# ========================
# Health Check
# ========================
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "models": {
            "eye": eye_model is not None,
            "nail": nail_model is not None,
            "palm": palm_model is not None
        }
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

        # Acquire lock: only ONE prediction runs at a time (thread-safe)
        with inference_lock:
            print("[AI] Processing combined prediction (locked)...")

            eye_score = safe_predict(eye_model, eye_file)
            print(f"  Eye score: {eye_score:.4f}")

            nail_score = safe_predict(nail_model, nail_file)
            print(f"  Nail score: {nail_score:.4f}")

            palm_score = safe_predict(palm_model, palm_file)
            print(f"  Palm score: {palm_score:.4f}")

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

        print(f"[AI] Result: {label} ({confidence}% confidence)")

        # Free memory
        gc.collect()

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        gc.collect()
        return jsonify({"error": str(e)}), 500


# ========================
# Legacy single prediction endpoint (backward compatibility)
# ========================
@app.route("/predict/single", methods=["POST"])
def predict_single_endpoint():
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
