"""
HemoVision AI - Flask Inference API
Loads trained MobileNetV2 models (eye, nail, palm) and serves predictions.
"""

import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import io
import traceback

app = Flask(__name__)
CORS(app)

# ========================
# Configuration
# ========================
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
IMG_SIZE = (224, 224)

# Class mapping based on alphabetical folder ordering in training data:
# Folder structure: anemia/ (index 0), normal/ (index 1)
# Model output (sigmoid): value close to 0 = anemia, value close to 1 = normal
CLASS_NAMES = {0: "Anemia", 1: "Normal"}

# ========================
# Load Models at Startup
# ========================
print("=" * 50)
print("Loading AI Models...")
print("=" * 50)

try:
    eye_model = load_model(os.path.join(MODEL_DIR, "eye_model_final.h5"))
    print("[OK] Eye model loaded successfully")
except Exception as e:
    print(f"[ERROR] Failed to load eye model: {e}")
    eye_model = None

try:
    nail_model = load_model(os.path.join(MODEL_DIR, "nail_model_final.h5"))
    print("[OK] Nail model loaded successfully")
except Exception as e:
    print(f"[ERROR] Failed to load nail model: {e}")
    nail_model = None

try:
    palm_model = load_model(os.path.join(MODEL_DIR, "palm_model_final.h5"))
    print("[OK] Palm model loaded successfully")
except Exception as e:
    print(f"[ERROR] Failed to load palm model: {e}")
    palm_model = None

print("=" * 50)
print("Model loading complete!")
print("=" * 50)


def preprocess_image(img_file):
    """
    Preprocess an uploaded image file for model inference.
    - Resize to 224x224
    - Use MobileNetV2 official preprocess_input
    - Expand dims for batch prediction
    """
    img = Image.open(img_file).convert("RGB")
    img = img.resize(IMG_SIZE)
    img_array = np.array(img)
    img_array = preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def predict_single(model, img_file):
    """Run prediction on a single image with a single model."""
    img_array = preprocess_image(img_file)
    prediction = model.predict(img_array, verbose=0)[0][0]
    return float(prediction)


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the service is running."""
    return jsonify({
        "status": "healthy",
        "models": {
            "eye": eye_model is not None,
            "nail": nail_model is not None,
            "palm": palm_model is not None
        }
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Combined prediction endpoint.
    Expects 3 image files: 'eye', 'nail', 'palm'
    Returns individual scores and combined prediction.
    """
    try:
        # Validate all 3 images are provided
        if "eye" not in request.files:
            return jsonify({"error": "Missing eye image"}), 400
        if "nail" not in request.files:
            return jsonify({"error": "Missing nail image"}), 400
        if "palm" not in request.files:
            return jsonify({"error": "Missing palm image"}), 400

        # Validate all models are loaded
        if eye_model is None or nail_model is None or palm_model is None:
            return jsonify({"error": "One or more AI models failed to load"}), 500

        eye_file = request.files["eye"]
        nail_file = request.files["nail"]
        palm_file = request.files["palm"]

        # Run predictions
        eye_score = predict_single(eye_model, eye_file)
        nail_score = predict_single(nail_model, nail_file)
        palm_score = predict_single(palm_model, palm_file)

        # Combined score (average of all 3 model outputs)
        final_score = (eye_score + nail_score + palm_score) / 3.0

        # Determine label: score < 0.5 means Anemia, >= 0.5 means Normal
        if final_score < 0.5:
            label = "Anemia"
        else:
            label = "Normal"

        # Calculate confidence (how far from the decision boundary)
        confidence = abs(final_score - 0.5) * 2 * 100  # Scale to 0-100%
        confidence = round(confidence, 1)

        # Determine clinical status
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

        print(f"\n--- Prediction Result ---")
        print(f"Eye:  {result['eye_score']}")
        print(f"Nail: {result['nail_score']}")
        print(f"Palm: {result['palm_score']}")
        print(f"Final: {result['final_score']} - {result['label']} ({result['confidence']}%)")
        print(f"------------------------\n")

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predict/single", methods=["POST"])
def predict_single_endpoint():
    """
    Single image prediction endpoint (for individual scans).
    Expects: 'image' file and 'type' field ('eye', 'nail', or 'palm')
    """
    try:
        if "image" not in request.files:
            return jsonify({"error": "Missing image file"}), 400

        scan_type = request.form.get("type", "").lower()
        img_file = request.files["image"]

        model_map = {
            "eye": eye_model,
            "conjunctiva": eye_model,
            "nail": nail_model,
            "nail bed": nail_model,
            "palm": palm_model
        }

        model = model_map.get(scan_type)
        if model is None:
            return jsonify({"error": f"Invalid scan type: {scan_type}"}), 400

        score = predict_single(model, img_file)

        if score < 0.5:
            label = "Anemia"
        else:
            label = "Normal"

        confidence = abs(score - 0.5) * 2 * 100
        confidence = round(confidence, 1)

        return jsonify({
            "score": round(score, 4),
            "label": label,
            "confidence": confidence
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print("\n[HemoVision AI] Inference Server starting...")
    print(f"Model directory: {MODEL_DIR}")
    print(f"Running on port {port}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
