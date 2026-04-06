"""Backend configuration — paths, model config, constants."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent  # d:/Python/BrainLens
MODELS_DIR = PROJECT_ROOT / "models"
RESULTS_DIR = PROJECT_ROOT / "results"
GALLERY_DIR = Path(__file__).parent.parent / "gallery"
STATIC_DIR = Path(__file__).parent.parent / "static"

L2_CLASSES = ["glioma", "meningioma", "no_tumor", "pituitary"]
L3_CLASSES = ["Astrocytoma", "GBM"]

BACKBONES = {
    "efficientnetv2_s": {"model_name": "efficientnet_v2_s", "library": "torchvision"},
    "efficientnetv2_b1": {"model_name": "tf_efficientnetv2_b1.in1k", "library": "timm"},
}

IMG_SIZE = 240

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://brainlens.ryanblake.dev",
]
