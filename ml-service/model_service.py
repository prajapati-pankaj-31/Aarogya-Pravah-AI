import os
import io
import logging
from contextlib import asynccontextmanager

import numpy as np
import requests
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from dotenv import load_dotenv

from huggingface_hub import hf_hub_download
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.densenet import preprocess_input

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("xray_screening_ml_service")

IMG_SIZE = (224, 224)
THRESHOLD = 0.5

CLASS_NAMES = [
    "Atelectasis", "Cardiomegaly", "Consolidation", "Edema",
    "Effusion", "Emphysema", "Fibrosis", "Hernia",
    "Infiltration", "Mass", "Nodule", "Pleural_Thickening",
    "Pneumonia", "Pneumothorax"
]

model = None  # loaded on startup
model_error = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: download + load model once (avoids cold-start-per-request)
    global model, model_error
    hf_repo_id = os.getenv("HF_REPO_ID")
    hf_model_filename = os.getenv("HF_MODEL_FILENAME")
    hf_repo_type = os.getenv("HF_REPO_TYPE", "dataset")  # 'dataset' or 'model'
    hf_token = os.getenv("HF_TOKEN") or None

    if not hf_repo_id or not hf_model_filename:
        logger.warning(
            "HF_REPO_ID or HF_MODEL_FILENAME not found in environment. "
            "Please configure ml-service/.env with your Hugging Face model details."
        )
        model_error = "HF_REPO_ID or HF_MODEL_FILENAME not set in environment."
        yield
        return

    try:
        logger.info(
            f"Downloading/loading model from Hugging Face: repo_id='{hf_repo_id}', "
            f"filename='{hf_model_filename}', repo_type='{hf_repo_type}'..."
        )
        download_kwargs = {
            "repo_id": hf_repo_id,
            "filename": hf_model_filename,
            "cache_dir": "model_cache",
        }
        if hf_repo_type:
            download_kwargs["repo_type"] = hf_repo_type
        if hf_token:
            download_kwargs["token"] = hf_token

        model_path = hf_hub_download(**download_kwargs)
        logger.info(f"Model downloaded successfully to: {model_path}")
        logger.info("Loading TensorFlow/Keras DenseNet model into memory...")
        model = load_model(model_path)
        model_error = None
        logger.info("TensorFlow/Keras model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load model from Hugging Face: {str(e)}")
        model_error = str(e)

    yield


app = FastAPI(
    title="Aarogya Pravah AI - Chest X-Ray Screening ML Service",
    description="FastAPI service for preliminary 14-class thoracic abnormality screening using TensorFlow/Keras DenseNet.",
    version="1.0.0",
    lifespan=lifespan
)

# Allow CORS for local orchestration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    image_url: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "classes_count": len(CLASS_NAMES),
        "model_error": model_error
    }


@app.post("/predict")
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model is not loaded: {model_error or 'Configure ml-service/.env with valid Hugging Face credentials.'}"
        )

    if not req.image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_url is required."
        )

    # 1. Fetch image from the URL Node.js already uploaded to Cloudinary
    try:
        response = requests.get(req.image_url, timeout=20)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch image from URL. Server returned HTTP {response.status_code}."
            )
        img = Image.open(io.BytesIO(response.content)).convert("RGB").resize(IMG_SIZE)
    except HTTPException:
        raise
    except Exception as img_err:
        logger.error(f"Failed to download/decode image from {req.image_url}: {str(img_err)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format or unable to decode image stream from the provided URL."
        )

    # 2. Preprocess image batch
    try:
        img_array = np.array(img).astype(np.float32)
        img_batch = np.expand_dims(img_array, axis=0)
        img_batch = preprocess_input(img_batch)

        # 3. Perform model inference
        predictions = model.predict(img_batch)[0]

        predicted_labels = [
            CLASS_NAMES[i] for i, p in enumerate(predictions) if float(p) > THRESHOLD
        ]
        probabilities = {
            CLASS_NAMES[i]: float(predictions[i]) for i in range(len(CLASS_NAMES))
        }

        logger.info(f"Inference completed. Predicted labels: {predicted_labels}")

        return {
            "predicted_labels": predicted_labels if predicted_labels else ["No Finding"],
            "probabilities": probabilities
        }
    except Exception as pred_err:
        logger.error(f"Prediction inference error: {str(pred_err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference failed on the preprocessed image."
        )


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    logger.info(f"Starting ML Service on http://{host}:{port}")
    uvicorn.run("model_service:app", host=host, port=port, reload=True)
