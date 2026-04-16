import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# =========================
# 1. Load trained models
# =========================
eye_model = load_model("models/eye_model_final.h5")
nail_model = load_model("models/nail_model_final.h5")
palm_model = load_model("models/palm_model_final.h5")

IMG_SIZE = (224, 224)

# =========================
# 2. Image preprocessing
# =========================
def preprocess_img(img_path):
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

# =========================
# 3. Individual prediction
# =========================
def predict_single(model, img_path):
    img_array = preprocess_img(img_path)
    pred = model.predict(img_array)[0][0]
    return float(pred)

# =========================
# 4. Combined prediction
# =========================
def predict_anemia(eye_img, nail_img, palm_img):
    eye_pred = predict_single(eye_model, eye_img)
    nail_pred = predict_single(nail_model, nail_img)
    palm_pred = predict_single(palm_model, palm_img)

    final_score = (eye_pred + nail_pred + palm_pred) / 3

    if final_score < 0.5:
        final_label = "Anemia"
    else:
        final_label = "Normal"

    print("\n----- Individual Model Scores -----")
    print(f"Eye Score  : {eye_pred:.4f}")
    print(f"Nail Score : {nail_pred:.4f}")
    print(f"Palm Score : {palm_pred:.4f}")
    print(f"\nFinal Average Score : {final_score:.4f}")
    print(f"Final Prediction    : {final_label}")

    return final_label, final_score

# =========================
# 5. Example usage
# =========================
if __name__ == "__main__":
    eye_img_path = "eyesample.jpeg"
    nail_img_path = "nailsample.jpeg"
    palm_img_path = "palmsample.jpeg"

    predict_anemia(eye_img_path, nail_img_path, palm_img_path)