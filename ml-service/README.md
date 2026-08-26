# Aarogya Pravah AI - Chest X-Ray Screening ML Service

A high-performance **FastAPI + TensorFlow/Keras DenseNet** microservice for automated preliminary screening of chest radiographs (X-rays) across 14 thoracic abnormality classes.

---

## 🎯 14 Thoracic Abnormality Classes

The model evaluates normalized RGB radiographs ($224 \times 224$) and provides probability distributions for:

1. **Atelectasis**
2. **Cardiomegaly**
3. **Consolidation**
4. **Edema**
5. **Effusion**
6. **Emphysema**
7. **Fibrosis**
8. **Hernia**
9. **Infiltration**
10. **Mass**
11. **Nodule**
12. **Pleural Thickening**
13. **Pneumonia**
14. **Pneumothorax**

---

## 🏗️ Architectural Flow

```text
React Frontend (Patient Portal)
      ↓ (multipart/form-data via multer.memoryStorage)
Node.js Express Backend
      ↓ (Stream to Cloudinary via uploadMedicalImageStream)
Cloudinary (Folder: aarogya-pravah-ai/xrays)
      ↓ (Returns secure_url)
Node.js issues Appointment Token immediately (HTTP 201)
      ↓ (Asynchronous non-blocking dispatch)
FastAPI ML Service (POST http://localhost:8001/predict with {"image_url": secure_url})
      ↓ (DenseNet Inference)
Returns {"predicted_labels": [...], "probabilities": {...}}
      ↓
Node.js Priority Engine recalculates multi-factor queue score
      ↓ (Socket.IO priority_updated)
Doctor Dashboard updates in real time
```

---

## 🚀 Setup & Execution

### 1. Create Python 3.11 Virtual Environment & Install Dependencies

> **Note for Windows**: TensorFlow requires Python 3.9–3.11 on Windows. Python 3.11 is strongly recommended.

```bash
cd ml-service

# Windows (using Python 3.11 launcher)
py -3.11 -m venv .venv
.\.venv\Scripts\activate

# Upgrade pip & install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

*(On Linux / macOS)*:
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Hugging Face model repository details:

```env
HF_REPO_ID=your_hf_username/chest-xray-dataset
HF_MODEL_FILENAME=densenet_chest_xray.h5
HF_REPO_TYPE=dataset
HOST=0.0.0.0
PORT=8001
```

> **Note on `HF_REPO_TYPE`**:
> - If your model file is located in a Hugging Face **Dataset** repo, keep `HF_REPO_TYPE=dataset`.
> - If your model file is located in a standard Hugging Face **Model** repo, set `HF_REPO_TYPE=model`.
> - If the repository is **private**, add `HF_TOKEN=hf_...` in `.env`.

### 3. Start the FastAPI Service

```bash
uvicorn model_service:app --host 0.0.0.0 --port 8001
```

The service will download and load the TensorFlow/Keras model once on startup and listen at `http://localhost:8001`.

---

## 🐳 Docker Deployment & Local Testing

### 1. Build Docker Image
```bash
cd ml-service
docker build -t aarogya-pravah-ml-service .
```

### 2. Run Docker Container Locally
```bash
docker run -d -p 8001:8001 \
  --env-file .env \
  --name ml-service-instance \
  aarogya-pravah-ml-service
```

### 3. Verify Health in Container
```bash
curl http://localhost:8001/health
```

---

## ☁️ Render Private Service Deployment Guide

To deploy this service on [Render](https://render.com) as a **Private Service** (accessible securely by your Node.js backend inside the Render private network):

1. **Create a New Private Service**:
   - Go to Render Dashboard $\rightarrow$ **New +** $\rightarrow$ **Private Service**.
   - Connect your GitHub repository.
   - Set **Root Directory** to `ml-service`.
   - Select **Docker** environment (or Python 3.11).

2. **Configure Environment Variables**:
   Under the service **Environment** settings, add:
   - `HF_REPO_ID`: `HF_username/HF_repo_name`
   - `HF_MODEL_FILENAME`: `chest_abnormality_densenet121_final.keras`
   - `HF_REPO_TYPE`: `dataset`
   - `HF_TOKEN`: `hf_...` (your Hugging Face access token)
   - `HOST`: `0.0.0.0`

3. **Internal Routing**:
   - Render will generate a private URL (e.g. `http://ml-service:8001` or `http://ml-service-XXXX:10000`).
   - In your Node.js backend environment variables on Render, set:
     `MODEL_SERVICE_URL=http://<render-private-service-name>:<port>`

---

## 📡 API Endpoints

### 1. Health Check
* **Endpoint**: `GET /health`
* **Response**:
```json
{
  "status": "ok",
  "model_loaded": true,
  "classes_count": 14,
  "model_error": null
}
```

### 2. Screen X-Ray Image
* **Endpoint**: `POST /predict`
* **Request**:
```json
{
  "image_url": "https://res.cloudinary.com/txxqpjph/image/upload/v12345/aarogya-pravah-ai/xrays/xray_anon_1787430187_7b38f8a0.jpg"
}
```
* **Response**:
```json
{
  "predicted_labels": [
    "Effusion",
    "Cardiomegaly"
  ],
  "probabilities": {
    "Atelectasis": 0.12,
    "Cardiomegaly": 0.81,
    "Consolidation": 0.08,
    "Edema": 0.14,
    "Effusion": 0.74,
    "Emphysema": 0.02,
    "Fibrosis": 0.03,
    "Hernia": 0.01,
    "Infiltration": 0.22,
    "Mass": 0.04,
    "Nodule": 0.06,
    "Pleural_Thickening": 0.15,
    "Pneumonia": 0.19,
    "Pneumothorax": 0.05
  }
}
```

---

## ⚕️ AI Safety & Clinical Notice

All outputs generated by this model are **preliminary image screening signals** for triage decision support and do **NOT** constitute a definitive clinical diagnosis. Final clinical assessment rests with licensed medical professionals.
