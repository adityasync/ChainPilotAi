"""
Standalone training script for Render pre-deploy command.
Trains all ML models from CSV data and saves them to app/ml/models/.
Run as: python train_models.py
"""
import json
import os
import sys
import time

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))


def main():
    model_dir = os.path.join("app", "ml", "models")
    data_dir = os.path.join("data", "processed")

    demand_csv = os.path.join(data_dir, "demand_data.csv")
    class_csv = os.path.join(data_dir, "classification_data.csv")

    if not os.path.exists(demand_csv) or not os.path.exists(class_csv):
        print(f"Training data not found at {data_dir}", flush=True)
        print(f"  demand_data.csv exists: {os.path.exists(demand_csv)}", flush=True)
        print(f"  classification_data.csv exists: {os.path.exists(class_csv)}", flush=True)
        sys.exit(1)

    os.makedirs(model_dir, exist_ok=True)
    print(f"Training models from {data_dir} -> {model_dir}", flush=True)

    import pandas as pd
    from app.ml.models.demand_forecasting import DemandForecastingModel
    from app.ml.models.inventory_risk_classifier import InventoryRiskClassifier
    from app.ml.models.supplier_delay_predictor import SupplierDelayPredictor
    from app.ml.models.cost_anomaly_detector import CostAnomalyDetector

    results = {}
    start = time.time()

    # Demand Forecasting
    try:
        df = pd.read_csv(demand_csv)
        print(f"  Training demand_forecasting ({len(df)} rows)...", flush=True)
        m = DemandForecastingModel()
        m.train(df)
        m.save_model(os.path.join(model_dir, "demand_forecasting_model.pkl"))
        results["demand_forecasting"] = "ok"
        print("  OK: demand_forecasting_model.pkl", flush=True)
    except Exception as e:
        results["demand_forecasting"] = f"error: {e}"
        print(f"  FAIL: demand_forecasting: {e}", flush=True)

    # Inventory Risk
    try:
        df = pd.read_csv(class_csv)
        print(f"  Training inventory_risk_classifier ({len(df)} rows)...", flush=True)
        m = InventoryRiskClassifier()
        m.train(df)
        m.save_model(os.path.join(model_dir, "inventory_risk_classifier.pkl"))
        results["inventory_risk_classifier"] = "ok"
        print("  OK: inventory_risk_classifier.pkl", flush=True)
    except Exception as e:
        results["inventory_risk_classifier"] = f"error: {e}"
        print(f"  FAIL: inventory_risk_classifier: {e}", flush=True)

    # Supplier Delay
    try:
        df = pd.read_csv(class_csv)
        print(f"  Training supplier_delay_predictor ({len(df)} rows)...", flush=True)
        m = SupplierDelayPredictor()
        m.train(df)
        m.save_model(os.path.join(model_dir, "supplier_delay_predictor.pkl"))
        results["supplier_delay_predictor"] = "ok"
        print("  OK: supplier_delay_predictor.pkl", flush=True)
    except Exception as e:
        results["supplier_delay_predictor"] = f"error: {e}"
        print(f"  FAIL: supplier_delay_predictor: {e}", flush=True)

    # Cost Anomaly
    try:
        df = pd.read_csv(class_csv)
        print(f"  Training cost_anomaly_detector ({len(df)} rows)...", flush=True)
        m = CostAnomalyDetector()
        m.train(df)
        m.save_model(os.path.join(model_dir, "cost_anomaly_detector.pkl"))
        results["cost_anomaly_detector"] = "ok"
        print("  OK: cost_anomaly_detector.pkl", flush=True)
    except Exception as e:
        results["cost_anomaly_detector"] = f"error: {e}"
        print(f"  FAIL: cost_anomaly_detector: {e}", flush=True)

    elapsed = time.time() - start

    # Write version manifest
    versions = {}
    lib_map = {"scikit-learn": "sklearn", "xgboost": "xgboost", "pandas": "pandas", "numpy": "numpy", "joblib": "joblib"}
    for lib, mod_name in lib_map.items():
        try:
            m = __import__(mod_name)
            versions[lib] = getattr(m, "__version__", "unknown")
        except ImportError:
            versions[lib] = "missing"

    versions_path = os.path.join(model_dir, ".ml_versions.json")
    with open(versions_path, "w") as f:
        json.dump(versions, f, indent=2)

    print(f"\nTraining complete in {elapsed:.1f}s: {results}", flush=True)
    print(f"Library versions: {versions}", flush=True)

    failed = [k for k, v in results.items() if v != "ok"]
    if failed:
        print(f"WARNING: {len(failed)} model(s) failed: {failed}", flush=True)


if __name__ == "__main__":
    main()
