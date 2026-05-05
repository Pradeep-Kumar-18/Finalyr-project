# HemoAI – Final Year Project Documentation
## Part 3: Implementation, Testing & Conclusion

---

# CHAPTER 4: IMPLEMENTATION

## 4.1 Project Setup

### Prerequisites
| Tool | Version |
|---|---|
| Node.js | 18+ |
| Anaconda Python | 3.10+ |
| TensorFlow | 2.19.0 |
| MongoDB Atlas | Free M0 Cluster |
| Cloudinary | Free tier |

### Directory Layout
```
HEMOAI-Final-year-project/
├── Dataset/
│   ├── eye/train/, eye/test/
│   ├── nail/train/, nail/test/
│   ├── palm/train/, palm/test/
│   ├── models/               ← trained .h5 files
│   ├── train_eye_model.py
│   ├── train_nail_model.py
│   ├── train_palm_model.py
│   └── predict_combined.py
├── Finalyear-Project-Back-end/
│   ├── ai-service/app.py
│   └── ... (Node.js backend)
├── Finalyear-Project-Front-end-/
│   └── ... (React/Vite)
└── HemoAI_Startup.ps1
```

## 4.2 AI Model Training Implementation

### Dataset Structure
```
eye/
  train/
    anemia/   ← images of anemic conjunctiva
    normal/   ← images of normal conjunctiva
  test/
    anemia/
    normal/
nail/ (same structure)
palm/ (same structure)
```
- Class index 0 = anemia, index 1 = normal (alphabetical ordering by Keras)
- Binary class mode used (`class_mode='binary'`)
- Batch size: 8 (small to handle limited data)

### train_eye_model.py Key Steps
```python
# 1. Data generators
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=30, zoom_range=0.3,
    width_shift_range=0.2, height_shift_range=0.2,
    shear_range=0.15, horizontal_flip=True
)

# 2. Build model
base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224,224,3))
base_model.trainable = False

model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(128, activation="relu"),
    Dropout(0.5),
    Dense(1, activation="sigmoid")
])

# 3. Stage 1 training (top layers only)
model.compile(optimizer=Adam(0.001), loss="binary_crossentropy", metrics=["accuracy"])

# 4. Stage 2 fine-tuning (unfreeze from layer 100)
base_model.trainable = True
for layer in base_model.layers[:100]:
    layer.trainable = False
model.compile(optimizer=Adam(0.00001), loss="binary_crossentropy", metrics=["accuracy"])

# 5. Save
model.save("models/eye_model_final.h5")
```
- Same script logic used for nail and palm models.
- All models saved as `.h5` files in `Dataset/models/` then **copied** to `ai-service/models/`.

## 4.3 Flask AI Service Implementation (app.py)

### Startup — Model Loading
```python
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
IMG_SIZE = (224, 224)
CLASS_NAMES = {0: "Anemia", 1: "Normal"}

eye_model  = load_model(os.path.join(MODEL_DIR, "eye_model_final.h5"))
nail_model = load_model(os.path.join(MODEL_DIR, "nail_model_final.h5"))
palm_model = load_model(os.path.join(MODEL_DIR, "palm_model_final.h5"))
```

### Image Preprocessing
```python
def preprocess_image(img_file):
    img = Image.open(img_file).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img)
    img_array = preprocess_input(img_array)  # MobileNetV2 official normalization
    return np.expand_dims(img_array, axis=0)
```

### /predict Endpoint
- Accepts `multipart/form-data` with fields: `eye`, `nail`, `palm`
- Runs `model.predict()` on each → float score (0–1)
- Averages scores → `final_score`
- Returns JSON: `{eye_score, nail_score, palm_score, final_score, label, confidence, status}`

### /health Endpoint
- Returns model load status: `{status: "healthy", models: {eye: true, nail: true, palm: true}}`

## 4.4 Node.js Backend Implementation

### Express App (index.js)
```javascript
dotenv.config();
connectDB();  // MongoDB Atlas connection

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(morgan('dev'));  // dev only

app.use('/api/auth',          authRoutes);
app.use('/api/scans',         scanRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);
app.use(errorHandler);
```

### JWT Authentication Middleware
```javascript
// protect middleware
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id);
```

### Combined Scan Controller (scanController.js)
```javascript
exports.createCombinedScan = async (req, res) => {
  // 1. Validate 3 files uploaded
  // 2. Get Cloudinary URLs from multer
  const eyeImageUrl  = req.files.eye[0].path;
  const nailImageUrl = req.files.nail[0].path;
  const palmImageUrl = req.files.palm[0].path;

  // 3. Call Flask service
  const prediction = await cnnService.predictCombined(req.files);

  // 4. Save to MongoDB
  const scan = await Scan.create({
    user: req.user.id, type: 'Combined',
    eyeScore: prediction.eye_score,
    nailScore: prediction.nail_score,
    palmScore: prediction.palm_score,
    finalScore: prediction.final_score,
    label: prediction.label,
    confidence: prediction.confidence,
    status: prediction.status,
    eyeImageUrl, nailImageUrl, palmImageUrl
  });
  res.status(201).json({ success: true, data: scan });
};
```

### CNN Service Bridge (cnnService.js)
```javascript
exports.predictCombined = async (files) => {
  const formData = new FormData();
  // For each image: stream from Cloudinary URL → append to FormData
  const eyeStream = await getImageStream(files.eye[0].path);
  formData.append('eye', eyeStream, { filename: 'eye.jpg' });
  // ... same for nail, palm

  const response = await axios.post(`${FLASK_API_URL}/predict`, formData, {
    headers: formData.getHeaders(),
    timeout: 60000
  });
  return response.data;
};
```

## 4.5 React Frontend Implementation

### Authentication (Auth.jsx)
- Toggle between Login / Register forms
- `POST /api/auth/login` → stores `token` + `user` in localStorage
- Redirects to `/dashboard` on success

### Dashboard (Dashboard.jsx)
- Sidebar with icon navigation (11 tabs)
- Scan tab: 3 file upload panels (eye, nail, palm) with image preview
- "Run Combined AI Analysis" button → `POST /api/scans/combined`
- 2-minute Axios timeout for AI inference
- Animated scanning overlay (neural network visualization)
- Results overlay: label badge, combined score, confidence, per-model score bars

### Framer Motion Animations
- Page transitions: `AnimatePresence` + `motion.div` on route changes
- Tab switches: fade + slide
- Results overlay: slide-up-fade entrance

### Environment Configuration
```
# .env (frontend)
VITE_API_URL=http://localhost:5000/api
```

## 4.6 Startup Automation (HemoAI_Startup.ps1)
```powershell
# Starts 3 separate PowerShell windows:
# Window 1: Python Flask AI service (port 5001)
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$AI_SERVICE_DIR'; & '$ANACONDA_PYTHON' app.py"

# Window 2: Node.js backend (port 5000)
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$BACKEND_DIR'; npm run dev"

# Window 3: React/Vite frontend (port 5173)
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$FRONTEND_DIR'; npm run dev"
```
Run: `.\HemoAI_Startup.ps1` from project root.

---

# CHAPTER 5: TEST PLAN AND TESTING

## 5.1 Testing Strategy
HemoAI testing covers 4 levels:
1. **Unit Testing** — Individual functions (preprocessing, prediction logic)
2. **Integration Testing** — API endpoint testing (Postman)
3. **System Testing** — End-to-end workflow testing
4. **Model Evaluation** — ML accuracy metrics

## 5.2 Unit Test Cases

### UT-01: Image Preprocessing
| Field | Detail |
|---|---|
| Function | `preprocess_image()` in app.py |
| Input | A valid JPEG image file |
| Expected | NumPy array shape `(1, 224, 224, 3)`, dtype float32 |
| Result | PASS |

### UT-02: Score Averaging
| Field | Detail |
|---|---|
| Logic | `(eye + nail + palm) / 3.0` |
| Input | eye=0.2, nail=0.3, palm=0.25 |
| Expected | final_score = 0.25, label = "Anemia" |
| Result | PASS |

### UT-03: Confidence Calculation
| Field | Detail |
|---|---|
| Formula | `abs(score - 0.5) * 2 * 100` |
| Input | final_score = 0.25 |
| Expected | confidence = 50.0% |
| Result | PASS |

### UT-04: Status Classification
| Score | Expected Status |
|---|---|
| 0.7 (Normal) | Normal |
| 0.35 (Anemia, >= 0.3) | Anemic |
| 0.1 (Anemia, < 0.3) | Critical |

### UT-05: Password Hashing
| Input | Expected |
|---|---|
| "password123" | bcrypt hash (60 chars) |
| `matchPassword("password123")` | true |
| `matchPassword("wrong")` | false |

### UT-06: JWT Token
| Scenario | Expected |
|---|---|
| Valid token | `req.user` populated |
| Expired/invalid token | 401 Unauthorized |
| Missing token | 401 Unauthorized |

## 5.3 Integration Test Cases (Postman)

### IT-01: User Registration
```
POST http://localhost:5000/api/auth/register
Body: { "name": "Test User", "email": "test@test.com", "password": "test123" }
Expected: 201, { success: true, token: "...", user: {...} }
```

### IT-02: User Login
```
POST http://localhost:5000/api/auth/login
Body: { "email": "test@test.com", "password": "test123" }
Expected: 200, { success: true, token: "...", user: {...} }
```

### IT-03: Flask Health Check
```
GET http://localhost:5001/health
Expected: 200, { status: "healthy", models: { eye: true, nail: true, palm: true } }
```

### IT-04: Combined Scan
```
POST http://localhost:5000/api/scans/combined
Headers: Authorization: Bearer <token>
Body: form-data — eye: <image>, nail: <image>, palm: <image>
Expected: 201, { success: true, data: { label: "Normal"|"Anemia", confidence: ..., status: ... } }
```

### IT-05: Get Scan History
```
GET http://localhost:5000/api/scans
Headers: Authorization: Bearer <token>
Expected: 200, { success: true, count: N, data: [...scans] }
```

### IT-06: Missing Image Validation
```
POST /api/scans/combined  (only 2 images uploaded)
Expected: 400, { success: false, error: "Please upload all 3 images: eye, nail, and palm" }
```

### IT-07: Invalid JWT
```
GET /api/scans  (no Authorization header)
Expected: 401, { success: false, error: "Not authorized" }
```

### IT-08: Flask /predict/single
```
POST http://localhost:5001/predict/single
Body: form-data — image: <image>, type: "palm"
Expected: 200, { score: 0.xxxx, label: "Normal"|"Anemia", confidence: xx.x }
```

## 5.4 System (End-to-End) Test Cases

### ST-01: Full Workflow
| Step | Action | Expected |
|---|---|---|
| 1 | Open http://localhost:5173 | Landing page loads |
| 2 | Click "Get Started" → Register | Dashboard accessible |
| 3 | Upload eye, nail, palm images | Previews shown |
| 4 | Click "Run Combined AI Analysis" | Scanning animation shows |
| 5 | Wait ~5-10 seconds | Results overlay appears |
| 6 | Verify label, scores, confidence | Values displayed correctly |
| 7 | Check MongoDB Atlas | New scan document created |
| 8 | Navigate to "Predictions" tab | Scan appears in history |

### ST-02: Logout and Re-login
| Step | Expected |
|---|---|
| Click logout → confirm | Redirected to /login |
| Login with same credentials | Dashboard accessible, history preserved |

### ST-03: AI Service Down
| Scenario | Expected |
|---|---|
| Flask not running, submit scan | Error message: "AI Service is not running..." |

## 5.5 Model Evaluation Metrics

| Model | Training Accuracy | Validation Accuracy | Notes |
|---|---|---|---|
| Eye Model | ~92% | ~85-90% | Best performing |
| Nail Model | ~88% | ~82-87% | Slightly harder features |
| Palm Model | ~89% | ~83-88% | Good generalization |

**Evaluation metrics used:**
- Binary cross-entropy loss
- Accuracy (primary metric)
- EarlyStopping monitors val_loss to prevent overfitting
- Class-weighted training for balanced evaluation

**Final model test:**
```python
loss, accuracy = model.evaluate(test_generator)
# Final Eye Model Test Accuracy: ~0.87
```

## 5.6 Known Issues & Resolutions

| Issue | Root Cause | Resolution |
|---|---|---|
| `ECONNREFUSED` on scan | Flask not started | Start Flask first via startup script |
| Model file not found | `.h5` not copied to `ai-service/models/` | Copy trained models from `Dataset/models/` |
| Cloudinary 401 | Env vars not set | Set CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET in `.env` |
| CORS error in browser | FRONTEND_URL mismatch | Set `FRONTEND_URL=http://localhost:5173` in backend `.env` |
| Prediction always 0.5 | Wrong preprocessing | Must use `preprocess_input` not `/255.0` |

---

# CHAPTER 6: CONCLUSION & FUTURE WORK

## 6.1 Conclusion
HemoAI successfully demonstrates a non-invasive anemia detection system using three MobileNetV2-based CNN models, a Flask inference API, a Node.js backend, and a React frontend. The combined tri-modal approach (eye + nail + palm) improves prediction robustness over single-image methods. The system is fully functional, with user authentication, scan history, and a polished holographic dashboard UI.

## 6.2 Future Enhancements
| Enhancement | Description |
|---|---|
| Grad-CAM Visualization | Highlight which image regions influenced the prediction |
| Hemoglobin Level Estimation | Regression model to estimate actual Hb g/dL |
| Mobile App | React Native version for on-the-go scanning |
| Doctor Review Module | Scan sharing with verified physicians |
| Larger Dataset | Collect more diverse clinical images to improve accuracy |
| Model Compression | TensorFlow Lite for edge/offline inference |
| Multi-language Support | UI in regional languages for rural deployment |
| Clinical Validation | Partner with hospitals for real-world accuracy studies |

## 6.3 References
1. WHO Global Anaemia Estimates — https://www.who.int/data/gho/data/themes/anaemia
2. MobileNetV2 paper — Sandler et al., 2018
3. TensorFlow Transfer Learning Guide — https://www.tensorflow.org
4. MongoDB Atlas Documentation — https://www.mongodb.com/docs/atlas
5. React Documentation — https://react.dev
6. Flask Documentation — https://flask.palletsprojects.com
7. Cloudinary Node.js SDK — https://cloudinary.com/documentation/node_integration
