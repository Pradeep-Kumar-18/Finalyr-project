# HemoAI – Final Year Project Documentation
## Part 1: Introduction & Software Requirements Specification

---

# CHAPTER 1: INTRODUCTION

## 1.1 Project Title
**HemoAI** — AI-Powered Non-Invasive Hemoglobin & Anemia Detection System

## 1.2 Abstract
HemoAI is a full-stack web application that uses deep learning (CNN/MobileNetV2) to detect anemia non-invasively by analyzing photographs of the eye conjunctiva, nail bed, and palm. The user uploads three images through a React-based dashboard. These are processed by a Node.js API, forwarded to a Python/Flask AI microservice, and the results are stored in MongoDB. The system returns per-model scores, a combined diagnosis (Normal / Anemic / Critical), and a confidence percentage — all without any blood test.

## 1.3 Problem Statement
Anemia affects over 1.62 billion people worldwide (WHO). Traditional diagnosis requires blood tests (CBC), which are invasive, costly, and inaccessible in rural/low-resource areas. Visible symptoms — pale conjunctiva, pale nail beds, pale palms — are well-known clinical indicators but require trained doctors. HemoAI digitises and automates this visual assessment using AI.

## 1.4 Objectives
1. Build three CNN models (eye, nail, palm) fine-tuned on MobileNetV2 to classify Anemia vs Normal.
2. Develop a Flask microservice to serve real-time predictions via REST API.
3. Build a Node.js/Express backend for user auth, scan storage, and image hosting (Cloudinary).
4. Build a React/Vite frontend with a holographic dashboard for uploading images and viewing results.
5. Store all scan history in MongoDB Atlas for longitudinal tracking.

## 1.5 Scope
- **In Scope:** User registration/login, 3-image combined scan, per-model score display, scan history, health profile, medical report, nutrition advisor, notification center, AI assistant chat.
- **Out of Scope:** Real blood test integration, clinical regulatory certification (FDA/CE), wearable integration.

## 1.6 Technology Overview

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Framer Motion, Axios |
| Backend API | Node.js, Express 5, MongoDB/Mongoose |
| AI Inference | Python 3, Flask 3, TensorFlow 2.19, MobileNetV2 |
| Storage | Cloudinary (images), MongoDB Atlas (data) |
| Auth | JWT (30-day tokens), bcryptjs |
| Startup | PowerShell script (HemoAI_Startup.ps1) |

---

# CHAPTER 2: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 2.1 Purpose
This SRS defines the functional and non-functional requirements of the HemoAI system.

## 2.2 Functional Requirements

### FR-01: User Authentication
- Users must register with name, email, password (min 6 chars).
- Users must log in to receive a JWT (30 days expiry).
- Passwords stored as bcrypt hash (salt rounds: 10).
- All scan/profile endpoints protected by Bearer token middleware.

### FR-02: Combined Scan (Primary Feature)
- User uploads exactly 3 images: eye (conjunctiva), nail bed, palm.
- Images uploaded via multipart/form-data to `POST /api/scans/combined`.
- Node.js backend stores images on Cloudinary and forwards to Flask AI service.
- Flask returns: eye_score, nail_score, palm_score, final_score, label, confidence, status.
- Scan record saved to MongoDB with all scores and image URLs.

### FR-03: Single Image Scan (Legacy)
- User uploads 1 image with a type field (Palm / Conjunctiva / Nail Bed).
- Endpoint: `POST /api/scans`.
- Flask `/predict/single` is called with image + type.

### FR-04: Scan History
- `GET /api/scans` returns all scans for authenticated user sorted newest-first.
- Frontend Diagnostic tab displays scan history with label, confidence, status, date.

### FR-05: Health Profile
- User can update: age, gender, blood group, height, weight.
- Endpoint: `PUT /api/profile`.

### FR-06: Medical Report
- Frontend generates a downloadable summary of recent scans.

### FR-07: Notification Center
- Stores and displays system/health alerts.
- Endpoints: `GET /api/notifications`, `PUT /api/notifications/:id` (mark read).

### FR-08: Nutrition Advisor
- Static and contextual dietary advice based on anemia status.

### FR-09: AI Assistant
- In-app chatbot for anemia and hemoglobin FAQs.

### FR-10: Model Diagnostics
- Shows health status of all 3 AI models (loaded/failed) via `GET /health` on Flask.

## 2.3 Non-Functional Requirements

| ID | Requirement | Detail |
|---|---|---|
| NFR-01 | Performance | AI inference < 10s per combined scan |
| NFR-02 | Scalability | MongoDB Atlas auto-scales; Flask can be containerised |
| NFR-03 | Security | JWT auth, bcrypt passwords, CORS policy, env vars for secrets |
| NFR-04 | Usability | Responsive glassmorphism UI, framer-motion animations |
| NFR-05 | Reliability | EarlyStopping + best-weight restoration during training |
| NFR-06 | Availability | 3-service architecture; any service can restart independently |

## 2.4 System Constraints
- Requires Anaconda Python for TensorFlow GPU support.
- Cloudinary free-tier image storage.
- MongoDB Atlas M0 free cluster.
- Models must be pre-trained and placed in `ai-service/models/` as `.h5` files.

## 2.5 User Roles

| Role | Access |
|---|---|
| Guest | Landing page only |
| Registered User | Full dashboard access after login |
| System (Flask) | Internal only — no public access |

## 2.6 Data Flow Summary
```
User Browser (React)
    → POST /api/scans/combined  (Node.js :5000)
        → Cloudinary (image upload)
        → POST /predict  (Flask :5001)
            → MobileNetV2 Eye Model
            → MobileNetV2 Nail Model
            → MobileNetV2 Palm Model
            ← { eye_score, nail_score, palm_score, final_score, label, confidence, status }
        → MongoDB Atlas (save Scan document)
    ← { success: true, data: scanRecord }
User Browser displays results overlay
```

## 2.7 API Endpoint Summary

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive JWT |

### Scan Routes (`/api/scans`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/scans` | Private | Get all scans for user |
| POST | `/api/scans` | Private | Single image scan |
| POST | `/api/scans/combined` | Private | Combined 3-image scan |

### Profile Routes (`/api/profile`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/profile` | Private | Get profile |
| PUT | `/api/profile` | Private | Update profile |

### Flask AI Routes (Internal, Port 5001)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Model load status |
| POST | `/predict` | Combined 3-image prediction |
| POST | `/predict/single` | Single image prediction |
