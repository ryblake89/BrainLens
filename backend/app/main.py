"""FastAPI application for BrainLens brain tumor classification API."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, STATIC_DIR
from app.routers import health, predict, samples, metrics

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading models...")
    from app.inference import load_all_models
    app.state.models = load_all_models()
    logger.info(f"Models loaded: {list(app.state.models.keys())}")
    yield


app = FastAPI(
    title="BrainLens API",
    description="Brain tumor MRI classification with Grad-CAM explainability",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(samples.router)
app.include_router(metrics.router)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
