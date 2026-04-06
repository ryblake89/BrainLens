"""Gallery sample endpoints — pre-computed predictions for demo images."""

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import GALLERY_DIR
from app.models import GalleryResponse

router = APIRouter(prefix="/samples", tags=["samples"])


@router.get("", response_model=GalleryResponse)
def list_samples():
    manifest_path = GALLERY_DIR / "manifest.json"
    if not manifest_path.exists():
        return GalleryResponse(samples=[])
    with open(manifest_path) as f:
        manifest = json.load(f)
    return GalleryResponse(samples=manifest["samples"])


@router.get("/{sample_id}/image.jpg")
def get_sample_image(sample_id: str):
    path = GALLERY_DIR / "images" / f"{sample_id}.jpg"
    if not path.exists():
        raise HTTPException(404, "Sample not found")
    return FileResponse(path, media_type="image/jpeg")


@router.get("/{sample_id}/gradcam/{backbone}.png")
def get_sample_gradcam(sample_id: str, backbone: str):
    path = GALLERY_DIR / "gradcam" / f"{sample_id}_{backbone}.png"
    if not path.exists():
        raise HTTPException(404, "Grad-CAM not found")
    return FileResponse(path, media_type="image/png")
