FROM python:3.12-slim

WORKDIR /app

# curl needed for health check
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (much smaller than default with CUDA)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Force-replace opencv-python (pulled by grad-cam) with headless version
RUN pip uninstall -y opencv-python 2>/dev/null; \
    pip install --no-cache-dir opencv-python-headless

COPY app/ app/
COPY gallery/ gallery/
COPY static/ static/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
