"""Prediction endpoint — upload image, get classification + Grad-CAM."""

import io

from fastapi import APIRouter, File, Form, Request, UploadFile
from PIL import Image

from app.inference import predict
from app.models import PredictionResponse

router = APIRouter(tags=["predict"])


@router.post("/predict", response_model=PredictionResponse)
async def predict_image(
    request: Request,
    file: UploadFile = File(...),
    backbone: str = Form("efficientnetv2_s"),
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    result = predict(request.app.state.models, image, backbone)
    return PredictionResponse(**result)
