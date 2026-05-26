import pandas as pd
import numpy as np
import os
from typing import Dict, Any, List, Tuple
import logging
from datetime import datetime
from ..models.demand_forecasting import DemandForecastingModel
from ..models.inventory_risk_classifier import InventoryRiskClassifier
from ..models.supplier_delay_predictor import SupplierDelayPredictor
from ..models.cost_anomaly_detector import CostAnomalyDetector

logger = logging.getLogger(__name__)


class MLPredictor:
    """
    Orchestrator for making predictions with all ML models in the supply chain platform
    """

    def __init__(self, model_dir: str = None):
        if model_dir is None:
            # Get directory of current file (predictor.py)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up one level to 'ml' then into 'models'
            self.model_dir = os.path.join(os.path.dirname(current_dir), "models")
        else:
            self.model_dir = model_dir
            
        self.models = {}
        self._load_all_models()

    def _load_all_models(self):
        """
        Load all trained ML models
        """
        logger.info("Loading all ML models...")

        # Load demand forecasting model
        try:
            df_model_path = os.path.join(self.model_dir, "demand_forecasting_model.pkl")
            if os.path.exists(df_model_path):
                self.models['demand_forecasting'] = DemandForecastingModel.load_model(df_model_path)
                logger.info("Demand forecasting model loaded successfully")
            else:
                logger.warning("Demand forecasting model not found, will need to be trained first")
        except Exception as e:
            logger.error(f"Error loading demand forecasting model: {str(e)}")

        # Load inventory risk classifier
        try:
            ir_model_path = os.path.join(self.model_dir, "inventory_risk_classifier.pkl")
            if os.path.exists(ir_model_path):
                self.models['inventory_risk_classifier'] = InventoryRiskClassifier.load_model(ir_model_path)
                logger.info("Inventory risk classifier loaded successfully")
            else:
                logger.warning("Inventory risk classifier not found, will need to be trained first")
        except Exception as e:
            logger.error(f"Error loading inventory risk classifier: {str(e)}")

        # Load supplier delay predictor
        try:
            sd_model_path = os.path.join(self.model_dir, "supplier_delay_predictor.pkl")
            if os.path.exists(sd_model_path):
                self.models['supplier_delay_predictor'] = SupplierDelayPredictor.load_model(sd_model_path)
                logger.info("Supplier delay predictor loaded successfully")
            else:
                logger.warning("Supplier delay predictor not found, will need to be trained first")
        except Exception as e:
            logger.error(f"Error loading supplier delay predictor: {str(e)}")

        # Load cost anomaly detector
        try:
            ca_model_path = os.path.join(self.model_dir, "cost_anomaly_detector.pkl")
            if os.path.exists(ca_model_path):
                self.models['cost_anomaly_detector'] = CostAnomalyDetector.load_model(ca_model_path)
                logger.info("Cost anomaly detector loaded successfully")
            else:
                logger.warning("Cost anomaly detector not found, will need to be trained first")
        except Exception as e:
            logger.error(f"Error loading cost anomaly detector: {str(e)}")

    def predict_demand(self, product_id: str, date: datetime) -> float:
        """
        Predict demand for a specific product on a specific date

        Args:
            product_id: ID of the product
            date: Date for prediction

        Returns:
            Predicted demand quantity
        """
        if 'demand_forecasting' not in self.models:
            raise ValueError("Demand forecasting model not loaded or trained")

        return self.models['demand_forecasting'].predict_single(product_id, date)

    def predict_inventory_risk(self, product_data: Dict[str, float]) -> Tuple[str, List[float]]:
        """
        Predict inventory risk for a product

        Args:
            product_data: Dictionary with product information

        Returns:
            Tuple of (risk label, prediction probabilities)
        """
        if 'inventory_risk_classifier' not in self.models:
            raise ValueError("Inventory risk classifier not loaded or trained")

        risk_label = self.models['inventory_risk_classifier'].predict_single(product_data)
        # Get probabilities for all classes
        single_df = pd.DataFrame([product_data])
        probas = self.models['inventory_risk_classifier'].predict_proba(single_df)[0]

        return risk_label, probas.tolist()

    def predict_supplier_delay(self, supplier_data: Dict[str, float]) -> Tuple[int, float]:
        """
        Predict if supplier will have delay

        Args:
            supplier_data: Dictionary with supplier information

        Returns:
            Tuple of (prediction: 0 or 1, probability: 0-1)
        """
        if 'supplier_delay_predictor' not in self.models:
            raise ValueError("Supplier delay predictor not loaded or trained")

        return self.models['supplier_delay_predictor'].predict_single(supplier_data)

    def detect_cost_anomaly(self, cost_data: Dict[str, float]) -> Tuple[int, float]:
        """
        Detect if cost is anomalous

        Args:
            cost_data: Dictionary with cost information

        Returns:
            Tuple of (prediction: -1 for anomaly/1 for normal, anomaly_score)
        """
        if 'cost_anomaly_detector' not in self.models:
            raise ValueError("Cost anomaly detector not loaded or trained")

        return self.models['cost_anomaly_detector'].predict_single(cost_data)

    def batch_predict_demand(self, data: List[Dict[str, Any]]) -> List[float]:
        """
        Batch predict demand for multiple products/dates

        Args:
            data: List of dictionaries with product_id and date

        Returns:
            List of predicted demand quantities
        """
        if 'demand_forecasting' not in self.models:
            raise ValueError("Demand forecasting model not loaded or trained")

        # Create a DataFrame for batch prediction
        df = pd.DataFrame(data)
        df['Order Date'] = pd.to_datetime(df['date'])
        predictions = self.models['demand_forecasting'].predict(df)
        return predictions.tolist()

    def batch_predict_inventory_risk(self, data: List[Dict[str, float]]) -> List[Tuple[str, List[float]]]:
        """
        Batch predict inventory risk for multiple products

        Args:
            data: List of dictionaries with product information

        Returns:
            List of tuples (risk label, prediction probabilities)
        """
        if 'inventory_risk_classifier' not in self.models:
            raise ValueError("Inventory risk classifier not loaded or trained")

        results = []
        for product_data in data:
            risk_label, probas = self.predict_inventory_risk(product_data)
            results.append((risk_label, probas))
        return results

    def batch_predict_supplier_delay(self, data: List[Dict[str, float]]) -> List[Tuple[int, float]]:
        """
        Batch predict supplier delay for multiple suppliers

        Args:
            data: List of dictionaries with supplier information

        Returns:
            List of tuples (prediction, probability)
        """
        if 'supplier_delay_predictor' not in self.models:
            raise ValueError("Supplier delay predictor not loaded or trained")

        results = []
        for supplier_data in data:
            pred, proba = self.predict_supplier_delay(supplier_data)
            results.append((pred, proba))
        return results

    def batch_detect_cost_anomaly(self, data: List[Dict[str, float]]) -> List[Tuple[int, float]]:
        """
        Batch detect cost anomalies for multiple records

        Args:
            data: List of dictionaries with cost information

        Returns:
            List of tuples (prediction, anomaly_score)
        """
        if 'cost_anomaly_detector' not in self.models:
            raise ValueError("Cost anomaly detector not loaded or trained")

        results = []
        for cost_data in data:
            pred, score = self.detect_cost_anomaly(cost_data)
            results.append((pred, score))
        return results

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about loaded models

        Returns:
            Dictionary with model information
        """
        info = {}
        for model_name, model in self.models.items():
            info[model_name] = {
                'is_trained': getattr(model, 'is_trained', False),
                'type': type(model).__name__
            }
        return info


def predict_sample_data():
    """
    Function to test predictions with sample data
    """
    predictor = MLPredictor()

    # Print model info
    print("\n=== Loaded Models ===")
    model_info = predictor.get_model_info()
    for model_name, info in model_info.items():
        print(f"{model_name}: {info['type']}, Trained: {info['is_trained']}")

    # If models are loaded, run some sample predictions
    if 'demand_forecasting' in predictor.models:
        try:
            sample_prediction = predictor.predict_demand("FUR-BO-10001798", datetime(2023, 1, 1))
            print(f"\nSample demand prediction: {sample_prediction:.2f}")
        except Exception as e:
            print(f"\nDemand prediction error: {str(e)}")

    if 'inventory_risk_classifier' in predictor.models:
        try:
            sample_data = {
                'Availability': 55,
                'Number of products sold': 802,
                'Revenue generated': 8661.99,
                'Stock levels': 58,
                'Lead times': 7,
                'Order quantities': 96,
                'Shipping costs': 2.95,
                'Price': 69.81
            }
            risk_label, probas = predictor.predict_inventory_risk(sample_data)
            print(f"Sample inventory risk prediction: {risk_label} with probabilities: {probas}")
        except Exception as e:
            print(f"Inventory risk prediction error: {str(e)}")

    if 'supplier_delay_predictor' in predictor.models:
        try:
            sample_data = {
                'Lead times': 7,
                'Order quantities': 96,
                'Shipping costs': 2.95,
                'Price': 69.81,
                'Availability': 55,
                'Number of products sold': 802
            }
            delay_pred, delay_proba = predictor.predict_supplier_delay(sample_data)
            print(f"Sample supplier delay prediction: {delay_pred}, probability: {delay_proba:.3f}")
        except Exception as e:
            print(f"Supplier delay prediction error: {str(e)}")

    if 'cost_anomaly_detector' in predictor.models:
        try:
            sample_data = {
                'Shipping costs': 2.95,
                'Number of products sold': 802,
                'Price': 69.81,
                'Order quantities': 96,
                'Lead times': 7
            }
            anomaly_pred, anomaly_score = predictor.detect_cost_anomaly(sample_data)
            print(f"Sample cost anomaly detection: {anomaly_pred}, score: {anomaly_score:.3f}")
        except Exception as e:
            print(f"Cost anomaly detection error: {str(e)}")


if __name__ == "__main__":
    predict_sample_data()