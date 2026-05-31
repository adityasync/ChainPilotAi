"""
ML Auto-Training Startup Module
================================
Called on app startup to ensure ML models are ready.

Logic:
  1. Check if all .pkl model files exist
  2. If yes, check if library versions match the .ml_versions.json manifest
  3. If models present AND versions match -> skip training (fast startup)
  4. If models missing OR versions changed -> train from CSV data
  5. On free tier: models must be pre-trained locally and committed

Path resolution:
  On Render: rootDir=backend, so CWD = backend/
    - data is at data/processed/ (inside backend/)
    - models go to app/ml/models/
"""

import json
import os
import time


def _resolve_data_dir() -> str | None:
    """Find data/processed/ directory."""
    candidates = [
        os.path.join("data", "processed"),
        os.path.join("..", "data", "processed"),
        os.path.join("backend", "data", "processed"),
    ]
    for path in candidates:
        abs_path = os.path.abspath(path)
        demand = os.path.join(abs_path, "demand_data.csv")
        classification = os.path.join(abs_path, "classification_data.csv")
        if os.path.exists(demand) and os.path.exists(classification):
            return abs_path
    return None


_EXPECTED_MODELS = [
    "demand_forecasting_model.pkl",
    "inventory_risk_classifier.pkl",
    "supplier_delay_predictor.pkl",
    "cost_anomaly_detector.pkl",
]


def _all_models_present(model_dir: str) -> bool:
    for name in _EXPECTED_MODELS:
        path = os.path.join(model_dir, name)
        if not os.path.exists(path) or os.path.getsize(path) < 100:
            return False
    return True


def _get_library_versions() -> dict:
    versions = {}
    lib_map = {"scikit-learn": "sklearn", "xgboost": "xgboost", "pandas": "pandas", "numpy": "numpy", "joblib": "joblib"}
    for lib, mod_name in lib_map.items():
        try:
            m = __import__(mod_name)
            versions[lib] = getattr(m, "__version__", "unknown")
        except ImportError:
            versions[lib] = "missing"
    return versions


def _train_all_models(model_dir: str, data_dir: str) -> dict:
    """Train all four base models from CSV data."""
    import pandas as pd
    from .models.demand_forecasting import DemandForecastingModel
    from .models.inventory_risk_classifier import InventoryRiskClassifier
    from .models.supplier_delay_predictor import SupplierDelayPredictor
    from .models.cost_anomaly_detector import CostAnomalyDetector

    os.makedirs(model_dir, exist_ok=True)
    results = {}

    try:
        df = pd.read_csv(os.path.join(data_dir, "demand_data.csv"))
        m = DemandForecastingModel()
        m.train(df)
        m.save_model(os.path.join(model_dir, "demand_forecasting_model.pkl"))
        results["demand_forecasting"] = "ok"
    except Exception as e:
        results["demand_forecasting"] = f"error: {e}"

    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        m = InventoryRiskClassifier()
        m.train(df)
        m.save_model(os.path.join(model_dir, "inventory_risk_classifier.pkl"))
        results["inventory_risk_classifier"] = "ok"
    except Exception as e:
        results["inventory_risk_classifier"] = f"error: {e}"

    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        m = SupplierDelayPredictor()
        m.train(df)
        m.save_model(os.path.join(model_dir, "supplier_delay_predictor.pkl"))
        results["supplier_delay_predictor"] = "ok"
    except Exception as e:
        results["supplier_delay_predictor"] = f"error: {e}"

    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        m = CostAnomalyDetector()
        m.train(df)
        m.save_model(os.path.join(model_dir, "cost_anomaly_detector.pkl"))
        results["cost_anomaly_detector"] = "ok"
    except Exception as e:
        results["cost_anomaly_detector"] = f"error: {e}"

    return results


def ensure_ml_ready() -> None:
    """
    Ensure ML models are ready. Skips training if models present + versions match.
    Only trains if models are missing or library versions changed.
    """
    model_dir = os.path.join("app", "ml", "models")
    versions_file = os.path.join(model_dir, ".ml_versions.json")

    print("=== ML Startup Check ===", flush=True)

    # Check if models exist and versions match
    if _all_models_present(model_dir):
        # Read stored versions
        stored = {}
        if os.path.exists(versions_file):
            try:
                with open(versions_file) as f:
                    stored = json.load(f)
            except Exception:
                stored = {}

        current = _get_library_versions()

        # Check if any version changed
        versions_match = True
        for lib in current:
            if stored.get(lib) != current[lib]:
                versions_match = False
                break

        if versions_match:
            print("Models present, versions match. Skipping training.", flush=True)
            print("=== ML Startup Check Done ===", flush=True)
            return
        else:
            print(f"Library versions changed ({stored} -> {current}). Retraining...", flush=True)
    else:
        print("Model files missing. Training required.", flush=True)

    # Need to train
    data_dir = _resolve_data_dir()
    if data_dir is None:
        print("ERROR: Training data not found! Cannot train models.", flush=True)
        print(f"CWD: {os.getcwd()}", flush=True)
        print("=== ML Startup Check Done (no data) ===", flush=True)
        return

    start = time.time()
    print(f"Training from {data_dir}...", flush=True)
    try:
        results = _train_all_models(model_dir, data_dir)
        elapsed = time.time() - start
        print(f"Training complete in {elapsed:.1f}s: {results}", flush=True)

        # Save version manifest
        current = _get_library_versions()
        try:
            with open(versions_file, "w") as f:
                json.dump(current, f, indent=2)
        except Exception as e:
            print(f"Could not write version manifest: {e}", flush=True)
    except Exception as e:
        print(f"Training failed: {e}", flush=True)
        import traceback
        traceback.print_exc()

    print("=== ML Startup Check Done ===", flush=True)
