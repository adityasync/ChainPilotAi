"""
ML Auto-Training Startup Module
================================
Called on app startup to ensure ML models are ready.

Logic:
  1. Verify training data exists in data/processed/ (committed to repo)
  2. Compare current ML library versions against stored .ml_versions.json
  3. If versions changed OR .pkl model files are missing → retrain from real data
  4. Store current versions for next restart

Path resolution:
  On Render: rootDir=backend, so CWD = backend/
    - data is at ../data/processed/ (project root)
    - models go to app/ml/models/
  Locally: CWD = backend/ (same as Render)
"""

import json
import logging
import os
import time

logger = logging.getLogger("ml.startup")

# ---------------------------------------------------------------------------
# Library version helpers
# ---------------------------------------------------------------------------

def _get_library_versions() -> dict:
    """Return versions of key ML libraries."""
    versions = {}
    for lib in ("scikit-learn", "xgboost", "pandas", "numpy", "joblib"):
        try:
            mod = lib.replace("-", "_")
            m = __import__(mod)
            versions[lib] = getattr(m, "__version__", "unknown")
        except ImportError:
            versions[lib] = "missing"
    return versions


def _versions_changed(stored: dict, current: dict) -> bool:
    """Check if any ML library version changed."""
    for lib in current:
        if stored.get(lib) != current[lib]:
            return True
    return False


# ---------------------------------------------------------------------------
# Data path resolution
# ---------------------------------------------------------------------------

def _resolve_data_dir() -> str | None:
    """
    Find data/processed/ directory. On Render (rootDir=backend),
    the data is at ../data/processed/ relative to CWD.
    """
    candidates = [
        os.path.join("..", "data", "processed"),   # Render: CWD=backend/
        os.path.join("data", "processed"),          # if CWD=project root
    ]
    for path in candidates:
        abs_path = os.path.abspath(path)
        demand = os.path.join(abs_path, "demand_data.csv")
        classification = os.path.join(abs_path, "classification_data.csv")
        if os.path.exists(demand) and os.path.exists(classification):
            logger.info("Found training data at %s", abs_path)
            return abs_path
    return None


# ---------------------------------------------------------------------------
# Model training from real data
# ---------------------------------------------------------------------------

def _train_all_models(model_dir: str, data_dir: str) -> dict:
    """Train all four base models from actual CSV data. Returns results dict."""
    import pandas as pd
    from .models.demand_forecasting import DemandForecastingModel
    from .models.inventory_risk_classifier import InventoryRiskClassifier
    from .models.supplier_delay_predictor import SupplierDelayPredictor
    from .models.cost_anomaly_detector import CostAnomalyDetector

    os.makedirs(model_dir, exist_ok=True)
    results = {}

    # --- Demand Forecasting ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "demand_data.csv"))
        logger.info("  Training demand_forecasting (%d rows)...", len(df))
        m = DemandForecastingModel()
        m.train(df)
        m.save_model(os.path.join(model_dir, "demand_forecasting_model.pkl"))
        results["demand_forecasting"] = "ok"
        logger.info("  ✓ demand_forecasting_model.pkl")
    except Exception as e:
        results["demand_forecasting"] = f"error: {e}"
        logger.error("  ✗ demand_forecasting: %s", e)

    # --- Inventory Risk ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        logger.info("  Training inventory_risk_classifier (%d rows)...", len(df))
        m = InventoryRiskClassifier()
        m.train(df)
        m.save_model(os.path.join(model_dir, "inventory_risk_classifier.pkl"))
        results["inventory_risk_classifier"] = "ok"
        logger.info("  ✓ inventory_risk_classifier.pkl")
    except Exception as e:
        results["inventory_risk_classifier"] = f"error: {e}"
        logger.error("  ✗ inventory_risk_classifier: %s", e)

    # --- Supplier Delay ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        logger.info("  Training supplier_delay_predictor (%d rows)...", len(df))
        m = SupplierDelayPredictor()
        m.train(df)
        m.save_model(os.path.join(model_dir, "supplier_delay_predictor.pkl"))
        results["supplier_delay_predictor"] = "ok"
        logger.info("  ✓ supplier_delay_predictor.pkl")
    except Exception as e:
        results["supplier_delay_predictor"] = f"error: {e}"
        logger.error("  ✗ supplier_delay_predictor: %s", e)

    # --- Cost Anomaly ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        logger.info("  Training cost_anomaly_detector (%d rows)...", len(df))
        m = CostAnomalyDetector()
        m.train(df)
        m.save_model(os.path.join(model_dir, "cost_anomaly_detector.pkl"))
        results["cost_anomaly_detector"] = "ok"
        logger.info("  ✓ cost_anomaly_detector.pkl")
    except Exception as e:
        results["cost_anomaly_detector"] = f"error: {e}"
        logger.error("  ✗ cost_anomaly_detector: %s", e)

    return results


# ---------------------------------------------------------------------------
# Models-present check
# ---------------------------------------------------------------------------

_EXPECTED_MODELS = [
    "demand_forecasting_model.pkl",
    "inventory_risk_classifier.pkl",
    "supplier_delay_predictor.pkl",
    "cost_anomaly_detector.pkl",
]


def _all_models_present(model_dir: str) -> bool:
    """Check if all expected .pkl files exist and are non-empty."""
    for name in _EXPECTED_MODELS:
        path = os.path.join(model_dir, name)
        if not os.path.exists(path) or os.path.getsize(path) < 100:
            return False
    return True


# ---------------------------------------------------------------------------
# Public entry point — called from main.py startup
# ---------------------------------------------------------------------------

def ensure_ml_ready() -> None:
    """
    Idempotent startup hook. Call from FastAPI's @app.on_event("startup").

    Trains models from the real dataset committed in data/processed/.
    On Render (rootDir=backend), data is resolved at ../data/processed/.
    """
    model_dir = os.path.join("app", "ml", "models")
    versions_file = os.path.join(model_dir, ".ml_versions.json")

    logger.info("═══ ML Startup Check ═══")

    # 1. Resolve training data location
    data_dir = _resolve_data_dir()
    if data_dir is None:
        logger.error(
            "Training data not found! Expected data/processed/demand_data.csv and "
            "classification_data.csv. ML models cannot be trained."
        )
        logger.info("═══ ML Startup Check Done (no data) ═══")
        return

    # 2. Read stored versions
    stored_versions = {}
    if os.path.exists(versions_file):
        try:
            with open(versions_file) as f:
                stored_versions = json.load(f)
        except Exception:
            stored_versions = {}

    # 3. Get current versions
    current_versions = _get_library_versions()
    logger.info("ML library versions: %s", current_versions)

    # 4. Decide whether to train
    needs_training = False

    if not _all_models_present(model_dir):
        logger.info("Model files missing — training required.")
        needs_training = True
    elif _versions_changed(stored_versions, current_versions):
        logger.info(
            "ML library versions changed (%s → %s) — retraining.",
            stored_versions, current_versions,
        )
        needs_training = True
    else:
        logger.info("All models present and versions unchanged — skipping training.")

    # 5. Train if needed
    if needs_training:
        start = time.time()
        logger.info("Starting model training from real data...")
        try:
            results = _train_all_models(model_dir, data_dir)
            elapsed = time.time() - start
            logger.info("Training complete in %.1fs: %s", elapsed, results)

            # Store versions only on successful training
            try:
                with open(versions_file, "w") as f:
                    json.dump(current_versions, f, indent=2)
                logger.info("Stored version manifest → %s", versions_file)
            except Exception as e:
                logger.warning("Could not write version manifest: %s", e)
        except Exception as e:
            logger.error("Training failed: %s", e)
            # Don't store versions — will retry next restart

    logger.info("═══ ML Startup Check Done ═══")
