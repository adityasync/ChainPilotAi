import pandas as pd
import os
from typing import Dict, Any
import logging
from ..models.demand_forecasting import DemandForecastingModel
from ..models.inventory_risk_classifier import InventoryRiskClassifier
from ..models.supplier_delay_predictor import SupplierDelayPredictor
from ..models.cost_anomaly_detector import CostAnomalyDetector
from ..models.ml_demand_forecaster import MLDemandForecaster, _is_sufficient_data

logger = logging.getLogger(__name__)


class MLTrainer:
    """
    Orchestrator for training all ML models in the supply chain platform
    """

    def __init__(self, base_dir: str = None):
        # Determine base paths dynamically
        if base_dir is None:
            # Current file is in backend/app/ml/training/trainer.py
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up 3 levels to get to backend root (backend/)
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
            # Go up 1 more level to get project root
            project_root = os.path.dirname(backend_root)
            
            self.model_dir = os.path.join(backend_root, "backend", "app", "ml", "models")
            # If backend/app/ml/models exists directly (depending on where backend_root is)
            if not os.path.exists(self.model_dir):
                 # Try typical structure
                 self.model_dir = os.path.join(current_dir, "..", "models")
            
            self.data_dir = os.path.join(project_root, "data", "processed")
        else:
            self.data_dir = os.path.join(base_dir, "data", "processed")
            self.model_dir = os.path.join(base_dir, "backend", "app", "ml", "models")
            
        # Ensure directories exist
        os.makedirs(self.model_dir, exist_ok=True)
        # Fix data dir path to use absolute path for robustness
        self.data_dir = os.path.abspath(self.data_dir)
        self.model_dir = os.path.abspath(self.model_dir)
        
        self.models = {}
        self.training_results = {}

    def load_data(self, filename: str) -> pd.DataFrame:
        """
        Load processed data from the specified file

        Args:
            filename: Name of the processed data file

        Returns:
            Loaded DataFrame
        """
        file_path = os.path.join(self.data_dir, f"{filename}.csv")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Data file not found: {file_path}")

        df = pd.read_csv(file_path)
        logger.info(f"Loaded data from {file_path} with shape {df.shape}")
        return df

    def train_demand_forecasting(self) -> Dict[str, Any]:
        """
        Train the demand forecasting model

        Returns:
            Training results
        """
        logger.info("Starting demand forecasting model training...")

        # Load demand data
        demand_data = self.load_data("demand_data")

        # Initialize and train model
        model = DemandForecastingModel()
        results = model.train(demand_data)

        # Save model
        model_path = os.path.join(self.model_dir, "demand_forecasting_model.pkl")
        model.save_model(model_path)

        self.models['demand_forecasting'] = model
        self.training_results['demand_forecasting'] = results

        logger.info("Demand forecasting model training completed.")
        return results

    def train_inventory_risk_classifier(self) -> Dict[str, Any]:
        """
        Train the inventory risk classifier
        
        Returns:
            Training results
        """
        logger.info("Starting inventory risk classifier training...")

        # Load classification data
        classification_data = self.load_data("classification_data")

        # Initialize and train model
        model = InventoryRiskClassifier()
        results = model.train(classification_data)

        # Save model
        model_path = os.path.join(self.model_dir, "inventory_risk_classifier.pkl")
        model.save_model(model_path)

        self.models['inventory_risk_classifier'] = model
        self.training_results['inventory_risk_classifier'] = results

        logger.info("Inventory risk classifier training completed.")
        return results

    def train_supplier_delay_predictor(self) -> Dict[str, Any]:
        """
        Train the supplier delay predictor
        
        Returns:
            Training results
        """
        logger.info("Starting supplier delay predictor training...")

        # Load classification data
        classification_data = self.load_data("classification_data")

        # Initialize and train model
        model = SupplierDelayPredictor()
        results = model.train(classification_data)

        # Save model
        model_path = os.path.join(self.model_dir, "supplier_delay_predictor.pkl")
        model.save_model(model_path)

        self.models['supplier_delay_predictor'] = model
        self.training_results['supplier_delay_predictor'] = results

        logger.info("Supplier delay predictor training completed.")
        return results

    def train_cost_anomaly_detector(self) -> Dict[str, Any]:
        """
        Train the cost anomaly detector
        
        Returns:
            Training results
        """
        logger.info("Starting cost anomaly detector training...")

        # Load classification data
        classification_data = self.load_data("classification_data")

        # Initialize and train model
        model = CostAnomalyDetector()
        results = model.train(classification_data)

        # Save model
        model_path = os.path.join(self.model_dir, "cost_anomaly_detector.pkl")
        model.save_model(model_path)

        self.models['cost_anomaly_detector'] = model
        self.training_results['cost_anomaly_detector'] = results

        logger.info("Cost anomaly detector training completed.")
        return results

    async def train_ml_demand_forecaster(self, db, company_id: int) -> Dict[str, Any]:
        """Train per-product ML demand forecasters for a company.

        Args:
            db: AsyncSession database session
            company_id: Company to train models for

        Returns:
            Training results summary
        """
        from sqlalchemy import select
        from ...models.order import Order
        from ...models.product_inventory import Product

        logger.info(f"Starting ML demand forecaster training for company {company_id}...")

        # Get all products with orders
        result = await db.execute(
            select(Product.id, Product.product_name)
            .filter(Product.company_id == company_id)
        )
        products = result.all()

        demand_ml_dir = os.path.join(self.model_dir, "demand_ml")
        os.makedirs(demand_ml_dir, exist_ok=True)

        trained = 0
        skipped = 0
        failed = 0

        for product_id, product_name in products:
            # Fetch order history
            orders_result = await db.execute(
                select(Order.order_date, Order.quantity)
                .filter(Order.product_id == product_id)
                .order_by(Order.order_date.asc())
            )
            raw_orders = [(row[0], row[1]) for row in orders_result.all()]

            if not _is_sufficient_data(raw_orders):
                skipped += 1
                continue

            try:
                ml = MLDemandForecaster()
                metrics = ml.train(raw_orders)
                model_path = os.path.join(demand_ml_dir, f"product_{product_id}.pkl")
                ml.save_model(model_path)
                trained += 1
                logger.info(f"Trained ML forecaster for '{product_name}' (id={product_id}): MAPE={metrics.get('mape')}")
            except Exception as e:
                failed += 1
                logger.warning(f"Failed to train ML forecaster for '{product_name}' (id={product_id}): {e}")

        result_summary = {
            "trained": trained,
            "skipped": skipped,
            "failed": failed,
            "total_products": len(products),
        }
        logger.info(f"ML demand forecaster training complete: {result_summary}")
        return result_summary

    def train_all_models(self) -> Dict[str, Any]:
        """
        Train all ML models in the supply chain platform

        Returns:
            Dictionary with results for all models
        """
        logger.info("Starting training for all ML models...")

        results = {}

        try:
            results['demand_forecasting'] = self.train_demand_forecasting()
        except Exception as e:
            logger.error(f"Error training demand forecasting model: {str(e)}")
            results['demand_forecasting'] = {'error': str(e)}

        try:
            results['inventory_risk_classifier'] = self.train_inventory_risk_classifier()
        except Exception as e:
            logger.error(f"Error training inventory risk classifier: {str(e)}")
            results['inventory_risk_classifier'] = {'error': str(e)}

        try:
            results['supplier_delay_predictor'] = self.train_supplier_delay_predictor()
        except Exception as e:
            logger.error(f"Error training supplier delay predictor: {str(e)}")
            results['supplier_delay_predictor'] = {'error': str(e)}

        try:
            results['cost_anomaly_detector'] = self.train_cost_anomaly_detector()
        except Exception as e:
            logger.error(f"Error training cost anomaly detector: {str(e)}")
            results['cost_anomaly_detector'] = {'error': str(e)}

        logger.info("Training completed for all models.")
        return results

    def evaluate_models(self) -> Dict[str, Any]:
        """
        Perform additional evaluation of trained models

        Returns:
            Dictionary with evaluation metrics
        """
        evaluations = {}

        # Here we could add cross-validation, additional metrics, etc.
        for model_name, results in self.training_results.items():
            evaluations[model_name] = {
                'metrics': results,
                'status': 'completed' if 'error' not in results else 'failed'
            }

        return evaluations


def train_all_models_cli():
    """
    Command-line interface function to train all models
    """
    trainer = MLTrainer()
    results = trainer.train_all_models()

    # Print summary
    print("\n=== Training Summary ===")
    for model_name, result in results.items():
        if 'error' not in result:
            print(f"\n{model_name}: Successfully trained")
            if 'random_forest' in result:
                if 'rmse' in result['random_forest']:
                    print(f"  - Random Forest RMSE: {result['random_forest']['rmse']:.4f}")
                    print(f"  - Random Forest MAE: {result['random_forest']['mae']:.4f}")
                elif 'accuracy' in result['random_forest']:
                    print(f"  - Random Forest Accuracy: {result['random_forest']['accuracy']:.4f}")
                elif 'roc_auc' in result['xgboost']:
                    print(f"  - XGBoost ROC-AUC: {result['xgboost']['roc_auc']:.4f}")
            elif 'anomaly_percentage' in result:
                print(f"  - Anomaly Percentage: {result['anomaly_percentage']:.2f}%")
        else:
            print(f"\n{model_name}: Failed - {result['error']}")

    return results


if __name__ == "__main__":
    train_all_models_cli()