"""Pydantic request/response schemas for the API."""

from pydantic import BaseModel


class ClassProbabilities(BaseModel):
    probabilities: dict[str, float]
    prediction: str
    confidence: float


class PredictionResponse(BaseModel):
    l2: ClassProbabilities
    l3: ClassProbabilities | None = None
    gradcam_b64: str
    ood_score: float
    ood_flag: bool
    inference_time_ms: float
    backbone: str
    disclaimer: str = "For educational purposes only. Not a medical diagnostic tool."


class GallerySample(BaseModel):
    id: str
    class_label: str
    image_url: str
    predictions: dict[str, dict]
    is_failure_case: bool = False
    notes: str | None = None


class GalleryResponse(BaseModel):
    samples: list[GallerySample]
