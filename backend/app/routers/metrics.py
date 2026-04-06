"""Metrics endpoints — training results, CV scores, analysis data."""

import json
from pathlib import Path

from fastapi import APIRouter

from app.config import RESULTS_DIR

router = APIRouter(prefix="/metrics", tags=["metrics"])


def _load_json(path: Path) -> dict | None:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return None


@router.get("")
def get_all_metrics():
    return {
        "l2": {
            "cv_s": _load_json(RESULTS_DIR / "l2" / "cv_results_efficientnetv2_s.json"),
            "cv_b1": _load_json(RESULTS_DIR / "l2" / "cv_results_efficientnetv2_b1.json"),
            "test": _load_json(RESULTS_DIR / "l2" / "test_results.json"),
            "calibration": _load_json(RESULTS_DIR / "l2" / "calibration.json"),
            "gradcam": _load_json(RESULTS_DIR / "l2" / "gradcam_eval.json"),
            "shortcut_test": _load_json(RESULTS_DIR / "l2" / "shortcut_test.json"),
            "pointing_game": _load_json(RESULTS_DIR / "l2" / "pointing_game.json"),
        },
        "l3": {
            "cv_s": _load_json(RESULTS_DIR / "l3" / "cv_results_efficientnetv2_s.json"),
            "cv_b1": _load_json(RESULTS_DIR / "l3" / "cv_results_efficientnetv2_b1.json"),
            "test": _load_json(RESULTS_DIR / "l3" / "test_results.json"),
            "cross_domain": _load_json(RESULTS_DIR / "l3" / "cross_domain_bt2d.json"),
        },
    }


@router.get("/training-history/{level}/{backbone}")
def get_training_history(level: str, backbone: str):
    """Return training history for all folds of a given level/backbone."""
    histories = {}
    results_dir = RESULTS_DIR / level
    if not results_dir.exists():
        return histories
    for f in sorted(results_dir.glob(f"history_{backbone}_fold*.json")):
        fold = f.stem.split("fold")[-1]
        with open(f) as fh:
            histories[f"fold_{fold}"] = json.load(fh)
    return histories
