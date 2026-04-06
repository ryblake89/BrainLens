"""Model loading, prediction, and Grad-CAM generation."""

import base64
import io
import logging
import time
from pathlib import Path

import numpy as np
import timm
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as tv_models
from PIL import Image
from pytorch_grad_cam import GradCAMPlusPlus
from pytorch_grad_cam.utils.image import show_cam_on_image

from app.config import MODELS_DIR, L2_CLASSES, L3_CLASSES, IMG_SIZE

logger = logging.getLogger(__name__)

MEAN = np.array([0.485, 0.456, 0.406])
STD = np.array([0.229, 0.224, 0.225])


def _create_model(backbone: str, num_classes: int):
    if backbone == "efficientnetv2_s":
        model = tv_models.efficientnet_v2_s(weights=None)
        model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(model.classifier[1].in_features, num_classes),
        )
    elif backbone == "efficientnetv2_b1":
        model = timm.create_model(
            "tf_efficientnetv2_b1.in1k", pretrained=False,
            num_classes=num_classes, drop_rate=0.3,
        )
    else:
        raise ValueError(f"Unknown backbone: {backbone}")
    return model


def _get_target_layer(model, backbone: str):
    if backbone == "efficientnetv2_b1":
        return [model.conv_head]
    elif backbone == "efficientnetv2_s":
        return [model.features[-1]]
    raise ValueError(f"Unknown backbone: {backbone}")


def _find_best_checkpoint(level: str, backbone: str) -> Path | None:
    ckpt_dir = MODELS_DIR / level
    if not ckpt_dir.exists():
        return None
    best_f1 = -1
    best_path = None
    for p in ckpt_dir.glob(f"{backbone}_fold*.pt"):
        ckpt = torch.load(p, weights_only=False, map_location="cpu")
        if ckpt.get("best_val_f1", 0) > best_f1:
            best_f1 = ckpt["best_val_f1"]
            best_path = p
    return best_path


def load_all_models() -> dict:
    """Load all model variants at startup. Returns dict of model_key -> {model, cam}."""
    models = {}
    for backbone in ["efficientnetv2_s", "efficientnetv2_b1"]:
        for level, num_classes in [("l2", 4), ("l3", 2)]:
            ckpt_path = _find_best_checkpoint(level, backbone)
            if ckpt_path is None:
                logger.warning(f"No checkpoint for {level}/{backbone}")
                continue

            model = _create_model(backbone, num_classes)
            ckpt = torch.load(ckpt_path, weights_only=False, map_location="cpu")
            model.load_state_dict(ckpt["model_state_dict"])
            model.eval()

            target_layers = _get_target_layer(model, backbone)
            cam = GradCAMPlusPlus(model=model, target_layers=target_layers)

            key = f"{level}_{backbone}"
            models[key] = {"model": model, "cam": cam}
            logger.info(f"Loaded {key} from {ckpt_path.name} (val_f1={ckpt.get('best_val_f1', '?')})")

    return models


def preprocess_image(image: Image.Image) -> tuple[torch.Tensor, np.ndarray]:
    """Preprocess PIL image. Returns (model_input_tensor, float_rgb_for_overlay)."""
    img = image.convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    img_np = np.array(img).astype(np.float32) / 255.0
    normalized = ((img_np - MEAN) / STD).transpose(2, 0, 1).astype(np.float32)
    tensor = torch.from_numpy(normalized).unsqueeze(0)
    return tensor, img_np


def predict(models: dict, image: Image.Image, backbone: str = "efficientnetv2_s") -> dict:
    """Run hierarchical prediction (L2, optionally L3) with Grad-CAM."""
    t0 = time.perf_counter()
    tensor, img_float = preprocess_image(image)

    # L2 prediction
    l2_key = f"l2_{backbone}"
    if l2_key not in models:
        raise ValueError(f"Model not loaded: {l2_key}")

    l2_model = models[l2_key]["model"]
    l2_cam = models[l2_key]["cam"]

    with torch.no_grad():
        l2_logits = l2_model(tensor)
    l2_probs = F.softmax(l2_logits, dim=1)[0].numpy()
    l2_pred_idx = int(l2_probs.argmax())
    l2_pred = L2_CLASSES[l2_pred_idx]

    # Grad-CAM for L2
    grayscale_cam = l2_cam(input_tensor=tensor)[0]
    overlay = show_cam_on_image(img_float, grayscale_cam, use_rgb=True)
    buf = io.BytesIO()
    Image.fromarray(overlay).save(buf, format="PNG")
    gradcam_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    l2_result = {
        "prediction": l2_pred,
        "confidence": float(l2_probs[l2_pred_idx]),
        "probabilities": {cls: float(p) for cls, p in zip(L2_CLASSES, l2_probs)},
    }

    # L3 prediction (only if glioma)
    l3_result = None
    if l2_pred == "glioma":
        l3_key = f"l3_{backbone}"
        if l3_key in models:
            l3_model = models[l3_key]["model"]
            with torch.no_grad():
                l3_logits = l3_model(tensor)
            l3_probs = F.softmax(l3_logits, dim=1)[0].numpy()
            l3_pred_idx = int(l3_probs.argmax())
            l3_result = {
                "prediction": L3_CLASSES[l3_pred_idx],
                "confidence": float(l3_probs[l3_pred_idx]),
                "probabilities": {cls: float(p) for cls, p in zip(L3_CLASSES, l3_probs)},
            }

    elapsed = (time.perf_counter() - t0) * 1000

    return {
        "l2": l2_result,
        "l3": l3_result,
        "gradcam_b64": gradcam_b64,
        "ood_score": 0.0,
        "ood_flag": False,
        "inference_time_ms": round(elapsed, 1),
        "backbone": backbone,
    }
