"""
ML Auto-Training Startup Module
================================
Called on app startup to ensure ML models are ready.
Always trains from CSV data on every startup (~11s) to guarantee
model compatibility with the current library versions.

Path resolution:
  On Render: rootDir=backend, so CWD = backend/
    - data is at data/processed/ (inside backend/)
    - models go to app/ml/models/
  Locally: CWD = backend/ (same as Render)
"""

import os
import time


def _resolve_data_dir() -> str | None:
    """
    Find data/processed/ directory. Tries multiple relative paths
    to cover local dev, Render native buildpack (CWD=backend/),
    and Docker (CWD=/app with COPY backend/ contents).
    """
    candidates = [
        os.path.join("data", "processed"),               # CWD=backend/ (Render or local)
        os.path.join("..", "data", "processed"),          # CWD=backend/app or similar
        os.path.join("backend", "data", "processed"),    # CWD=repo root
    ]
    for path in candidates:
        abs_path = os.path.abspath(path)
        demand = os.path.join(abs_path, "demand_data.csv")
        classification = os.path.join(abs_path, "classification_data.csv")
        if os.path.exists(demand) and os.path.exists(classification):
            print(f"Found training data at {abs_path}", flush=True)
            return abs_path
    print(f"No training data found. Tried: {[os.path.abspath(c) for c in candidates]}", flush=True)
    return None


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
        print(f"  Training demand_forecasting ({len(df)} rows)...", flush=True)
        m = DemandForecastingModel()
        m.train(df)
        m.save_model(os.path.join(model_dir, "demand_forecasting_model.pkl"))
        results["demand_forecasting"] = "ok"
        print("  OK: demand_forecasting_model.pkl", flush=True)
    except Exception as e:
        results["demand_forecasting"] = f"error: {e}"
        print(f"  FAIL: demand_forecasting: {e}", flush=True)

    # --- Inventory Risk ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        print(f"  Training inventory_risk_classifier ({len(df)} rows)...", flush=True)
        m = InventoryRiskClassifier()
        m.train(df)
        m.save_model(os.path.join(model_dir, "inventory_risk_classifier.pkl"))
        results["inventory_risk_classifier"] = "ok"
        print("  OK: inventory_risk_classifier.pkl", flush=True)
    except Exception as e:
        results["inventory_risk_classifier"] = f"error: {e}"
        print(f"  FAIL: inventory_risk_classifier: {e}", flush=True)

    # --- Supplier Delay ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        print(f"  Training supplier_delay_predictor ({len(df)} rows)...", flush=True)
        m = SupplierDelayPredictor()
        m.train(df)
        m.save_model(os.path.join(model_dir, "supplier_delay_predictor.pkl"))
        results["supplier_delay_predictor"] = "ok"
        print("  OK: supplier_delay_predictor.pkl", flush=True)
    except Exception as e:
        results["supplier_delay_predictor"] = f"error: {e}"
        print(f"  FAIL: supplier_delay_predictor: {e}", flush=True)

    # --- Cost Anomaly ---
    try:
        df = pd.read_csv(os.path.join(data_dir, "classification_data.csv"))
        print(f"  Training cost_anomaly_detector ({len(df)} rows)...", flush=True)
        m = CostAnomalyDetector()
        m.train(df)
        m.save_model(os.path.join(model_dir, "cost_anomaly_detector.pkl"))
        results["cost_anomaly_detector"] = "ok"
        print("  OK: cost_anomaly_detector.pkl", flush=True)
    except Exception as e:
        results["cost_anomaly_detector"] = f"error: {e}"
        print(f"  FAIL: cost_anomaly_detector: {e}", flush=True)

    return results


# ---------------------------------------------------------------------------
# Public entry point -- called from main.py startup
# ---------------------------------------------------------------------------

def ensure_ml_ready() -> None:
    """
    Always trains models on startup from CSV data.
    Takes ~11s which is acceptable for free-tier deploys.
    """
    model_dir = os.path.join("app", "ml", "models")

    print("=== ML Startup: Training models ===", flush=True)

    # 1. Resolve training data location
    data_dir = _resolve_data_dir()
    if data_dir is None:
        print("ERROR: Training data not found! ML models cannot be trained.", flush=True)
        print(f"CWD: {os.getcwd()}", flush=True)
        return

    # 2. Always train (ensures version compatibility)
    start = time.time()
    print(f"Training from {data_dir}...", flush=True)
    try:
        results = _train_all_models(model_dir, data_dir)
        elapsed = time.time() - start
        print(f"Training complete in {elapsed:.1f}s: {results}", flush=True)
    except Exception as e:
        print(f"Training failed: {e}", flush=True)
        import traceback
        traceback.print_exc()

    print("=== ML Startup: Done ===", flush=True)
