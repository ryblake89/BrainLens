FROM python:3.12-slim

WORKDIR /app

# System deps for OpenCV (required by pytorch-grad-cam)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 libxcb1 curl \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (much smaller than default with CUDA)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY gallery/ gallery/
COPY static/ static/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
