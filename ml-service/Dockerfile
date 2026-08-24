# Use official lightweight Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    HOST=0.0.0.0

# Install system dependencies needed for Pillow and TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose default port (Render dynamically assigns $PORT at runtime)
EXPOSE 8001

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8001}/health || exit 1

# Start FastAPI application using Uvicorn with dynamic $PORT support
CMD ["sh", "-c", "uvicorn model_service:app --host 0.0.0.0 --port ${PORT:-8001}"]
