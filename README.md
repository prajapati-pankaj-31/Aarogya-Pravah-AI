# Aarogya Pravah AI (आरोग्य प्रवाह)

### *Intelligent Multi-Factor Patient Triage & Dynamic Queue Management Prototype*

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20Socket.IO-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![ML Microservice](https://img.shields.io/badge/ML%20Service-FastAPI%20%7C%20TensorFlow%20DenseNet121-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Clinical LLM](https://img.shields.io/badge/Clinical%20AI-Groq%20LLaMA%203.3%20%2F%20Qwen-F05032?style=flat&logo=groq)](https://groq.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Storage](https://img.shields.io/badge/Storage-Cloudinary%20Medical%20Images-3448C5?style=flat&logo=cloudinary)](https://cloudinary.com/)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%2B%20Render-black?style=flat&logo=vercel)](https://vercel.com/)

---

## 📌 Executive Summary

Overcrowded hospital outpatient and emergency waiting rooms often rely on static, first-come-first-served queues that fail to account for acute deterioration, complex symptom profiles, and radiological urgency.

**Aarogya Pravah AI** is an **AI-powered clinical decision-support prototype** designed to assist hospital reception, triage staff, and physicians in dynamically prioritizing patient queues. It unifies:
1. **Groq LLM Clinical Decision Support** for fast, structured symptom severity and risk extraction.
2. **DenseNet121 Chest Radiograph Screening** (FastAPI + TensorFlow) for preliminary thoracic abnormality detection across 14 pathological classes.
3. **Multi-Factor Priority Scoring Engine** providing dynamic, anti-starvation queue reordering in real-time over **Socket.IO**.

---

## 🏛️ System Architecture

```text
                               ┌─────────────────────────────┐
                               │   React 18 + Vite Frontend  │
                               │      (Deployed on Vercel)   │
                               └──────────────┬──────────────┘
                                              │ HTTP / WebSocket
                                              ▼
                               ┌─────────────────────────────┐
                               │   Node.js / Express Gateway │
                               │   (Deployed on Render Web)  │
                               └──────┬───────┬───────┬──────┘
                                      │       │       │
             ┌────────────────────────┘       │       └────────────────────────┐
             ▼                                ▼                                ▼
  ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
  │ Cloudinary Storage   │        │ Groq LLM API         │        │ FastAPI ML Service   │
  │ • Anonymized X-rays  │        │ • Clinical Triage    │        │ • DenseNet121 Model  │
  │ • Privacy-safe IDs   │        │ • Urgency / Risk     │        │ • 14 Class Screening │
  └──────────┬───────────┘        └──────────┬───────────┘        └──────────┬───────────┘
             │                               │                               │
             └───────────────────────┬───────┴───────────────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    Backend Priority Engine   │
                      │  (Single Source of Truth)    │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    MongoDB Atlas Database    │
                      │  QueueEntry / AI / Image DB  │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    Socket.IO Real-Time Bus   │
                      │  Live Dashboards Push Events │
                      └──────────────────────────────┘
```

---

## 🔬 AI / ML Decision-Support Pipeline

```
Patient Intake + Optional X-Ray
   │
   ├──▶ Groq Clinical Triage (LLaMA 3.3 / Qwen)
   │       └── Yields: Urgency Level (LOW–CRITICAL) + Clinical Risk Level (LOW–CRITICAL)
   │
   ├──▶ FastAPI + TensorFlow DenseNet121 Inference
   │       └── Yields: 14 Thoracic Class Probabilities + Normalized Screening Score (0.0 – 1.0)
   │
   └──▶ Mathematical Priority Engine Calculation
           └── Formula: Final Priority Score = S_clinical + S_accident + S_ai_urgency + S_ai_risk + S_image + S_aging + S_hold_boost
```

### 1. Pre-Trained Chest X-Ray Model (`DenseNet121`)
* **Framework**: TensorFlow 2.15 / Keras with DenseNet121 architecture.
* **Weights Source**: Automatically pulled once at service startup from Hugging Face dataset repository (`kul-91/SIH_project`).
* **Input**: Anonymized $224 \times 224$ RGB chest radiographs via direct Cloudinary stream.
* **Classes Evaluated (14)**:
  `Atelectasis`, `Cardiomegaly`, `Consolidation`, `Edema`, `Effusion`, `Emphysema`, `Fibrosis`, `Hernia`, `Infiltration`, `Mass`, `Nodule`, `Pleural_Thickening`, `Pneumonia`, `Pneumothorax`.
* **Decision Threshold**: Configured at $0.50$. Images with all class probabilities below threshold are reported as `"No Finding"` with highest confidence signal context.

### 2. Multi-Factor Mathematical Formulation
The final queue position is calculated **strictly in the backend** (`backend/src/services/priorityService.js`):

$$\text{Priority Score} = S_{\text{clinical}} + S_{\text{accident}} + S_{\text{ai\_urgency}} + S_{\text{ai\_risk}} + S_{\text{image}} + S_{\text{aging}} + S_{\text{pending\_return}}$$

* **$S_{\text{clinical}}$**: Staff-verified severity ($10$ pts for `LOW`, $25$ pts for `MEDIUM`, $50$ pts for `HIGH`, $80$ pts for `CRITICAL`).
* **$S_{\text{accident}}$**: Trauma boost ($0$ pts for `NONE`, $10$ pts for `EASY`, $25$ pts for `MEDIUM`, $45$ pts for `HIGH`).
* **$S_{\text{ai\_urgency}}$**: Groq AI urgency assessment ($5$ to $45$ pts).
* **$S_{\text{ai\_risk}}$**: Groq AI risk factors ($5$ to $40$ pts).
* **$S_{\text{image}}$**: DenseNet screening score ($\text{round}(\text{imageScore} \times 30)$, max $30$ pts).
* **$S_{\text{aging}}$**: Anti-starvation compensation ($+2.0$ pts added per 10 minutes wait, capped at $30$ pts).
* **$S_{\text{pending\_return}}$**: Diagnostic hold return boost ($+35$ pts) for patients returning from labs/imaging.

---

## 🛠️ Complete Tech Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons, Axios, Socket.IO Client |
| **Backend API Gateway** | Node.js (v20), Express 4, Express-Validator, Helmet, CORS, Morgan |
| **Real-Time Communication** | Socket.IO (Room-targeted event emissions) |
| **ML Microservice** | Python 3.11, FastAPI, Uvicorn, TensorFlow 2.15, Keras, Pillow, Hugging Face Hub |
| **Clinical LLM** | Groq Cloud SDK (`llama-3.3-70b-versatile` / `qwen/qwen3.6-27b`) |
| **Database & ORM** | MongoDB Atlas, Mongoose 8 (Compound indexing on `department` + `priorityScore`) |
| **Medical Imaging** | Cloudinary API (Streaming in-memory upload, privacy-sanitized public IDs) |
| **Container & Hosting** | Docker, Render Web & Private Services, Vercel |

---

## ✨ Core User Experiences

### 1. Patient Portal & Privacy-Safe Live Tracker
* Self-intake registration supporting structured symptoms, self-assessed severity (`Easy`, `Medium`, `High`), trauma status, and X-ray attachment.
* Generates an instant, unique token (e.g. `EMG-20260826-8827`).
* Privacy-safe live tracker displays real-time queue position, estimated wait time, preliminary ML screening status, and highest signal without exposing other patients' protected health information.

### 2. Staff Triage & Verification Desk
* Real-time stream of incoming patient registrations via Socket.IO room `join_staff`.
* High-resolution lightbox image preview with side-by-side DenseNet preliminary findings and probabilities.
* Human-in-the-loop validation: Staff can confirm, adjust severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), or request intake clarification.

### 3. Doctor Smart Priority Queue
* Real-time waiting list ordered dynamically by computed priority score.
* Comprehensive clinical summary with Groq triage reasoning, radiological screening breakdown, and historical hospital visit timeline.
* Clinical workflow actions: **Start Consultation**, **Place on Diagnostic Hold**, **Resume with Priority Boost (+35 pts)**, and **Complete Consultation with Rx record**.

---

## 🧪 Verified Integration & Simulation Results

### Multi-Patient Clinical Triage Simulation (`Emergency` Dept)

```text
+-----+--------------+------------------------------------+----------------+-------+-----------------------------+----------------------+
| Pos | Token        | Patient Scenario                   | Priority Level | Score | ML Screening Status         | Top ML Signal        |
+-----+--------------+------------------------------------+----------------+-------+-----------------------------+----------------------+
| #1  | TKN-TEST-E   | Patient E (Trauma Accident Case)   | CRITICAL       |  210  | No X-Ray                    | N/A                  |
| #2  | TKN-TEST-D   | Patient D (High-Risk + Abnormality)| CRITICAL       |  161  | CRITICAL_ABNORMALITY        | Pneumothorax (85.0%) |
| #3  | TKN-TEST-B   | Patient B (High Severity Symptoms) | HIGH           |  105  | No X-Ray                    | N/A                  |
| #4  | TKN-TEST-C   | Patient C (Moderate + Clear X-Ray) | MEDIUM         |   61  | No Finding                  | Effusion (27.96%)    |
| #5  | TKN-TEST-A   | Patient A (Routine Wellness Check) | LOW            |   20  | No X-Ray                    | N/A                  |
+-----+--------------+------------------------------------+----------------+-------+-----------------------------+----------------------+
```

### Subsystem Verification Status
* **Cloudinary Upload**: Verified streaming upload with non-PII IDs (`xray_anon_...`).
* **FastAPI ML Service**: Healthy on `/health` (`model_loaded: true`, 14 classes active).
* **TensorFlow DenseNet121**: Model weights loaded once at startup into memory.
* **Groq Clinical AI**: Triage assessment executed server-side with thinking-tag filtering.
* **Socket.IO Real-Time Bus**: Verified event propagation across staff, patient, and doctor rooms.
* **Automated Test Suites**: 14/14 core integration tests and 5/5 multi-severity tests passed.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* **Node.js**: v18.x or v20.x
* **Python**: 3.11.x
* **MongoDB**: Local instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

---

### 1. ML Microservice (FastAPI + TensorFlow)
```bash
cd ml-service

# Create Python 3.11 virtual environment
python -m venv .venv
# Activate environment (Windows PowerShell: .\.venv\Scripts\Activate.ps1 | Linux/macOS: source .venv/bin/activate)

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Set HF_REPO_ID, HF_MODEL_FILENAME, HF_REPO_TYPE, HF_TOKEN

# Start ML service
uvicorn model_service:app --host 0.0.0.0 --port 8001
```
*Health Check*: `http://localhost:8001/health`

---

### 2. Node.js Backend Gateway
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set MONGODB_URI, JWT_SECRET, GROQ_API_KEY, CLOUDINARY_*, MODEL_SERVICE_URL

# (Optional) Seed default users & sample queue
npm run seed

# Start server
npm start
```
*Health Check*: `http://localhost:5000/api/health`

---

### 3. React Frontend
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start Vite development server
npm run dev
```
*App URL*: `http://localhost:3000`

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/aarogya_pravah_ai
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=aarogya-pravah-ai/xrays
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=qwen/qwen3.6-27b
MODEL_SERVICE_URL=http://localhost:8001
MODEL_SERVICE_TIMEOUT=20000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### ML Service (`ml-service/.env`)
```env
HOST=0.0.0.0
PORT=8001
HF_REPO_ID=your_HF_username/your_HF_repo_name
HF_MODEL_FILENAME=chest_abnormality_densenet121_final.keras
HF_REPO_TYPE=dataset
HF_TOKEN=your_HF_access_token
```

---

## ☁️ Production Deployment Architecture

```text
Frontend (Vercel)          ──▶ Static SPA hosting with edge rewrites via vercel.json
Backend (Render Web)       ──▶ Node.js Web Service running Express + Socket.IO (render.yaml)
ML Service (Render Docker) ──▶ Private Service container running Python 3.11 + TensorFlow
Database (MongoDB Atlas)   ──▶ Managed cloud database with compound queue indexing
Media Storage (Cloudinary) ──▶ Privacy-safe streaming storage for medical radiographs
```

---

## ⚕️ Prototype Disclaimer & Safety Notice

> **IMPORTANT CLINICAL & REGULATORY NOTICE**  
> **Aarogya Pravah AI is an experimental clinical decision-support and administrative queue management prototype.**
> * Predictions produced by the TensorFlow DenseNet model and Groq clinical parser are **preliminary triage decision-support signals** designed to assist healthcare professionals in administrative prioritization.
> * They do **NOT** constitute a definitive clinical diagnosis, radiological interpretation, or treatment prescription.
> * Final clinical assessment, diagnosis, and patient management remain the sole responsibility of licensed healthcare practitioners.