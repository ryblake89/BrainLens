"""Health check endpoint."""

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(request: Request):
    models = list(request.app.state.models.keys()) if hasattr(request.app.state, "models") else []
    return {"status": "healthy", "models_loaded": models}
