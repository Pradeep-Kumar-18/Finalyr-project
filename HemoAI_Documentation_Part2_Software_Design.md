# HemoAI – Final Year Project Documentation
## Part 2: Software Design

---

# CHAPTER 3: SOFTWARE DESIGN

## 3.1 System Architecture

HemoAI follows a **3-tier microservice architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                             │
│        React 19 + Vite  (localhost:5173)                    │
│  Components: Auth, Dashboard, Diagnostic, MedicalReport,    │
│  HealthProfile, NutritionAdvisor, AIAssistant, etc.         │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP (Axios)
┌──────────────────────────▼──────────────────────────────────┐
│                   APPLICATION TIER                          │
│         Node.js / Express 5  (localhost:5000)               │
│  Routes → Controllers → Services → Models (Mongoose)        │
│  Middleware: JWT Auth, Multer (Cloudinary), ErrorHandler     │
└──────────┬──────────────────────────────┬───────────────────┘
           │ Mongoose                     │ Axios HTTP
           ▼                             ▼
┌──────────────────┐          ┌──────────────────────────────┐
│  MongoDB Atlas   │          │   AI SERVICE TIER            │
│  Collections:    │          │   Python Flask (port 5001)   │
│  - users         │          │   MobileNetV2 × 3 models     │
│  - scans         │          │   /predict  /predict/single  │
│  - notifications │          │   /health                    │
│  - reports       │          └──────────────────────────────┘
└──────────────────┘
```

## 3.2 Database Design (MongoDB)

### Collection: users
```json
{
  "_id": ObjectId,
  "name": String (required),
  "email": String (required, unique),
  "password": String (bcrypt, hidden by default),
  "age": Number,
  "gender": String,
  "bloodGroup": String,
  "height": Number,
  "weight": Number,
  "createdAt": Date
}
```

### Collection: scans
```json
{
  "_id": ObjectId,
  "user": ObjectId (ref: User, required),
  "type": Enum ["Palm","Conjunctiva","Nail Bed","Combined"],
  "eyeScore": Number (0–1),
  "nailScore": Number (0–1),
  "palmScore": Number (0–1),
  "finalScore": Number (0–1),
  "label": Enum ["Anemia","Normal"],
  "confidence": Number (0–100),
  "status": Enum ["Normal","Anemic","Critical"],
  "eyeImageUrl": String (Cloudinary URL),
  "nailImageUrl": String (Cloudinary URL),
  "palmImageUrl": String (Cloudinary URL),
  "imageUrl": String (legacy),
  "hb": Number (legacy, default 0),
  "spo2": Number (legacy, default 98),
  "createdAt": Date
}
```

### Collection: notifications
```json
{
  "_id": ObjectId,
  "user": ObjectId,
  "message": String,
  "read": Boolean,
  "createdAt": Date
}
```

### Collection: reports
```json
{
  "_id": ObjectId,
  "user": ObjectId,
  "content": String,
  "createdAt": Date
}
```

## 3.3 AI Model Design

### Architecture: MobileNetV2 (Transfer Learning)

All three models share the same architecture:

```
Input: 224×224×3 RGB image
    ↓
MobileNetV2 (pretrained on ImageNet, include_top=False)
    ↓  [Stage 1: frozen base; Stage 2: unfrozen from layer 100]
GlobalAveragePooling2D
    ↓
Dense(128, activation='relu')
    ↓
Dropout(0.5)
    ↓
Dense(1, activation='sigmoid')
    ↓
Output: float [0.0 = Anemia, 1.0 = Normal]
```

### Training Strategy (2-Stage Fine-Tuning)

**Stage 1 — Top Layer Training**
- Freeze MobileNetV2 base
- Optimizer: Adam(lr=0.001)
- Loss: Binary Crossentropy
- Epochs: 10
- Callbacks: EarlyStopping(patience=5), ModelCheckpoint (best val_accuracy)

**Stage 2 — Fine-Tuning**
- Unfreeze MobileNetV2 layers from index 100 onwards
- Optimizer: Adam(lr=0.00001)
- Epochs: 25
- Callbacks: EarlyStopping(patience=7), ReduceLROnPlateau(factor=0.2, patience=3), ModelCheckpoint

### Data Augmentation (Training Only)
| Augmentation | Value |
|---|---|
| Rotation | ±30° |
| Zoom | 30% |
| Width shift | 20% |
| Height shift | 20% |
| Shear | 15% |
| Horizontal flip | Yes |
| Fill mode | Nearest |

### Class Imbalance Handling
- `sklearn.utils.class_weight.compute_class_weight('balanced')` used
- Class weights passed to `model.fit()` to penalise majority class errors

### Prediction Logic
```
eye_score  = sigmoid output of eye model (0–1)
nail_score = sigmoid output of nail model (0–1)
palm_score = sigmoid output of palm model (0–1)

final_score = (eye_score + nail_score + palm_score) / 3.0

label:
  final_score < 0.5  → "Anemia"
  final_score >= 0.5 → "Normal"

confidence = |final_score - 0.5| × 2 × 100   (scale: 0–100%)

status:
  label == "Normal"          → "Normal"
  label == "Anemia" & score >= 0.3 → "Anemic"
  label == "Anemia" & score < 0.3  → "Critical"
```

## 3.4 Backend Design (Node.js)

### Folder Structure
```
Finalyear-Project-Back-end/
├── index.js              ← Express app entry point
├── config/
│   └── db.js             ← MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── scanController.js
│   ├── profileController.js
│   ├── reportController.js
│   └── notificationController.js
├── models/
│   ├── User.js
│   ├── Scan.js
│   ├── Report.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── scanRoutes.js
│   ├── profileRoutes.js
│   ├── reportRoutes.js
│   └── notificationRoutes.js
├── middleware/
│   └── errorMiddleware.js
├── services/
│   └── cnnService.js     ← Axios bridge to Flask
└── ai-service/
    ├── app.py            ← Flask inference server
    ├── requirements.txt
    └── models/
        ├── eye_model_final.h5
        ├── nail_model_final.h5
        └── palm_model_final.h5
```

### Middleware Stack
1. `express.json()` — JSON body parsing
2. `cors(corsOptions)` — CORS with frontend URL whitelist
3. `morgan('dev')` — HTTP logging (development only)
4. `protect` (JWT auth) — applied to all private routes
5. `errorHandler` — global error response formatter

### CNN Service Bridge (cnnService.js)
- Downloads image from Cloudinary URL as stream
- Builds `multipart/form-data` with `form-data` npm package
- POSTs to Flask `/predict` with 60s timeout
- Returns parsed prediction JSON to controller

## 3.5 Frontend Design (React)

### Routes
| Path | Component | Description |
|---|---|---|
| `/` | Home | Landing page |
| `/login` | Auth | Login / Register form |
| `/dashboard` | Dashboard | Main app shell |

### Dashboard Tab System
| Tab Key | Component | Feature |
|---|---|---|
| `scan` | Dashboard (inline) | 3-image upload + AI analysis |
| `history` | Diagnostic | Past scan history |
| `cells` | BloodCellViewer | RBC morphology viewer |
| `compare` | ComparisonEngine | Compare two scans |
| `tracker` | HealthTracker | Timeline chart |
| `report` | MedicalReport | Generate/download report |
| `advisor` | NutritionAdvisor | Diet recommendations |
| `help` | HelpCenter | FAQ + support |
| `notifications` | NotificationCenter | Alerts |
| `profile` | HealthProfile | User profile edit |
| `diagnostics` | ModelDiagnostics | AI model status |

### State Management
- React `useState` / `useRef` (no Redux)
- `localStorage` for JWT token and user object
- Axios for all API calls with Bearer token header
- Framer Motion `AnimatePresence` for page transitions

## 3.6 Security Design
| Concern | Solution |
|---|---|
| Password storage | bcryptjs, salt rounds=10 |
| Authentication | JWT, 30-day expiry |
| Route protection | `protect` middleware on all private routes |
| CORS | Whitelist `FRONTEND_URL` env var |
| Secrets | `.env` file, never committed to git |
| Image storage | Cloudinary (no local disk exposure) |
