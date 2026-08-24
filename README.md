# Aarogya Pravah AI — AI-Powered Smart Patient Queue Management System

A production-grade, clinical-grade intelligent patient queue management and triage system built for modern hospitals. **Aarogya Pravah AI** combines **Groq LLM clinical triage decision support**, a standalone **FastAPI + TensorFlow/Keras DenseNet121 chest X-ray screening microservice**, and a **dynamic multi-factor priority scoring engine** connected in real-time over **Socket.IO** with a specialized **React + Tailwind** healthcare frontend.

---

## 🏛️ System Architecture

```text
React Frontend (Vercel)
         │
         ▼
Node.js / Express Gateway (Render Web Service)
   │               │                │
   │               │                ▼
   │               │       Cloudinary (Medical Images)
   │               ▼                │
   │      Groq Clinical AI          │
   │      (qwen / llama)            │
   │               │                │
   ▼               ▼                ▼
FastAPI + TensorFlow DenseNet121 ML Service (Render Private Service)
   │               │                │
   └───────────────┼────────────────┘
                   ▼
         Priority Engine (Single Source of Truth)
                   │
                   ▼
         MongoDB Atlas (QueueEntry / Analyses)
                   │
                   ▼
         Socket.IO Real-Time Stream
                   │
                   ▼
         Patient / Staff / Doctor Dashboards
```

---

## 🚀 Key Subsystems & Features

1. **Patient Self-Check-in & Digital Token Generation**:
   - Fast appointment registration with structured symptoms, severity, trauma flag, and direct-stream Cloudinary medical X-ray upload (`multipart/form-data`).
   - Generates unique tracking tokens (e.g. `EMG-20260824-2037`, `TKN-20260824-5391`).

2. **Privacy-Safe Real-Time Token Tracker**:
   - Patients track live queue position, estimated waiting time, preliminary X-ray screening status, and highest screening signal.
   - Non-diagnostic AI safety disclaimer clearly displayed.

3. **Staff Triage & Human-in-the-Loop Verification**:
   - Real-time intake notification stream over Socket.IO (`join_staff`).
   - Staff review symptoms, inspect uploaded high-res X-rays in a lightbox viewer, adjust clinical severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and approve verified check-ins.

4. **Groq Clinical AI Triage**:
   - Secure server-side execution (API keys never exposed to React).
   - Generates clinical urgency score, risk category, risk factors, and recommended priority level with reasoning-tag filtering.

5. **FastAPI + TensorFlow/Keras DenseNet121 Chest X-Ray Screening**:
   - Standalone containerized Python 3.11 microservice downloading pre-trained DenseNet121 weights from Hugging Face at startup.
   - Generates a 14-class thoracic probability distribution and normalized administrative screening status (`NORMAL`, `MODERATE_FINDINGS`, `CRITICAL_ABNORMALITY_DETECTED`).

6. **Mathematical Multi-Factor Priority Engine**:
   - Sole authority for computing final priority score:
     $$\text{Priority Score} = S_{\text{clinical}} + S_{\text{accident}} + S_{\text{ai\_urgency}} + S_{\text{ai\_risk}} + S_{\text{image\_screening}} + S_{\text{aging}} + S_{\text{pending\_return}}$$
   - Anti-starvation aging boost (+2 points per 10 minutes wait).
   - Priority boost (+35 points) for patients returning from diagnostic hold.

7. **Doctor Clinical Dashboard & Consultation Workflow**:
   - Live waiting queue sorted strictly by backend `priorityScore` (DESC).
   - Full patient clinical file with Groq AI analysis, radiological scan viewer, and past visit timeline.
   - Clinical actions: Start Consultation, Hold (Pending Labs/Scans), Resume from Hold, Complete Consultation & Record Rx.

---

## 📁 Repository Structure

```text
Aarogya-Pravah-AI/
├── frontend/                     # React + Vite SPA (Vercel-ready)
│   ├── src/
│   │   ├── components/           # Reusable UI components & navigation
│   │   ├── pages/                # Patient, Staff, and Doctor dashboards
│   │   ├── services/             # API client & Socket.IO client
│   │   └── hooks/                # Custom React hooks
│   ├── vercel.json               # Vercel SPA routing rewrites
│   ├── .env.example              # Frontend environment template
│   └── package.json
├── backend/                      # Node.js + Express + Socket.IO Gateway (Render-ready)
│   ├── src/
│   │   ├── config/               # MongoDB, Cloudinary, CORS configuration
│   │   ├── controllers/          # Route handlers (auth, patient, staff, doctor, ai)
│   │   ├── models/               # Mongoose schemas (Appointment, QueueEntry, AIAnalysis, etc.)
│   │   ├── routes/               # Express REST routes
│   │   ├── services/             # Priority Engine, Groq, Cloudinary, Queue services
│   │   └── sockets/              # Socket.IO event handlers and emitters
│   ├── scripts/                  # Seed scripts & automated integration test suites
│   ├── .env.example              # Backend environment template
│   └── package.json
├── ml-service/                   # FastAPI + TensorFlow/Keras DenseNet121 Service
│   ├── model_service.py          # FastAPI application & Hugging Face loader
│   ├── requirements.txt          # Python dependencies (TensorFlow, FastAPI, etc.)
│   ├── Dockerfile                # Production multi-platform container definition
│   ├── .dockerignore             # Excludes venv, cache, and secrets
│   ├── .env.example              # ML service environment template
│   └── README.md
├── render.yaml                   # Render Blueprint for Backend + ML Private Service
├── .gitignore                    # Comprehensive repository ignores
└── README.md
```

---

## 🛠️ Local Development Setup

To run all 3 services locally on your development machine:

### Prerequisites
* **Node.js**: v18+ or v20+
* **Python**: 3.11.x (recommended for TensorFlow binary compatibility)
* **MongoDB**: Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas

---

### Step 1: Start the FastAPI ML Service (Port 8001)

```bash
cd ml-service

# Create and activate Python 3.11 virtual environment
py -3.11 -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Set HF_REPO_ID, HF_MODEL_FILENAME, HF_REPO_TYPE, HF_TOKEN

# Start FastAPI server
uvicorn model_service:app --host 0.0.0.0 --port 8001
```
*Health check*: `GET http://localhost:8001/health` $\rightarrow$ `{"status": "ok", "model_loaded": true}`

---

### Step 2: Start the Node.js Backend Server (Port 5000)

```bash
cd backend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Configure MONGODB_URI, JWT_SECRET, GROQ_API_KEY, CLOUDINARY_*, MODEL_SERVICE_URL

# (Optional) Seed default users and sample triage data
npm run seed

# Start server
npm start
```
*Health check*: `GET http://localhost:5000/api/health`

---

### Step 3: Start the React Frontend (Port 3000 / 5173)

```bash
cd frontend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start Vite development server
npm run dev
```
*Open in browser*: `http://localhost:3000` or `http://localhost:5173`

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port provided by hosting platform | `5000` |
| `NODE_ENV` | Environment mode | `production` / `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | `<secure-random-string>` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `FRONTEND_URL` | Allowed client origin(s) for CORS | `https://aarogya-pravah.vercel.app` |
| `CLIENT_URL` | Additional/local client URL for CORS | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API access key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |
| `CLOUDINARY_FOLDER` | Destination folder in Cloudinary | `aarogya-pravah-ai/xrays` |
| `GROQ_API_KEY` | Groq Cloud API access key | `gsk_...` |
| `GROQ_MODEL` | Groq model identifier | `qwen/qwen3.6-27b` or `llama-3.3-70b-versatile` |
| `MODEL_SERVICE_URL` | URL of the ML screening service | `http://localhost:8001` or Render private URL |
| `MODEL_SERVICE_TIMEOUT`| Inference request timeout (ms) | `20000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API endpoint (with `/api`) | `https://your-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | Backend Socket.IO endpoint (without `/api`) | `https://your-backend.onrender.com` |

### ML Service (`ml-service/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Injected port by hosting platform | `8001` |
| `HOST` | Bind host address | `0.0.0.0` |
| `HF_REPO_ID` | Hugging Face repository ID | `kul-91/SIH_project` |
| `HF_MODEL_FILENAME` | Keras model artifact filename | `chest_abnormality_densenet121_final.keras` |
| `HF_REPO_TYPE` | Repository type (`dataset` or `model`) | `dataset` |
| `HF_TOKEN` | Hugging Face user access token | `hf_...` |

---

## ☁️ Production Deployment Guide

### 1. Database Setup (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and allow network access (`0.0.0.0/0` or Render static outbound IPs).
3. Copy the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/aarogya_pravah_ai?retryWrites=true&w=majority`.

### 2. ML Service Deployment (Render Private Service / Container)
1. In Render Dashboard: **New +** $\rightarrow$ **Private Service** (or Web Service).
2. Connect repo `prajapati-pankaj-31/Aarogya-Pravah-AI`.
3. Set **Root Directory** to `ml-service`, **Environment** to `Docker`.
4. Configure environment variables: `HF_REPO_ID`, `HF_MODEL_FILENAME`, `HF_REPO_TYPE`, `HF_TOKEN`, `HOST=0.0.0.0`.
5. Render provides a private internal address: `http://aarogya-pravah-ml-service:8001`.

### 3. Backend Deployment (Render Web Service)
1. In Render Dashboard: **New +** $\rightarrow$ **Web Service**.
2. Set **Root Directory** to `backend`, **Runtime** to `Node`.
3. Build Command: `npm install`, Start Command: `npm start`.
4. Add all environment variables listed in the Backend table above.
5. Set `MODEL_SERVICE_URL=http://aarogya-pravah-ml-service:8001`.

### 4. Frontend Deployment (Vercel)
1. In [Vercel Dashboard](https://vercel.com): **Add New...** $\rightarrow$ **Project**.
2. Select repository, set **Root Directory** to `frontend`, Framework Preset: `Vite`.
3. Under Environment Variables:
   - `VITE_API_URL`: `https://<your-render-backend-url>/api`
   - `VITE_SOCKET_URL`: `https://<your-render-backend-url>`
4. Deploy. Copy the live Vercel URL and update `FRONTEND_URL` in the Render Backend settings.

---

## ⚕️ Clinical Safety & AI Disclaimer

**Aarogya Pravah AI** is designed exclusively as an **administrative triage and clinical decision-support platform**.
* Predictions generated by the TensorFlow/Keras DenseNet model and Groq triage parser are **preliminary signals** intended to assist healthcare staff in queue prioritization.
* They do **NOT** constitute a definitive clinical or radiological diagnosis.
* Final diagnosis and patient disposition remain the sole responsibility of licensed healthcare practitioners.