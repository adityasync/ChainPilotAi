#!/usr/bin/env python3
"""
Model Evaluation Script

This script provides comprehensive evaluation of trained ML models,
including cross-validation, detailed metrics, and comparison reports.

Usage:
    python evaluate_models.py --all
    python evaluate_models.py --model demand_forecasting
    python evaluate_models.py --all --output evaluation_report.json
"""

import argparse
import logging
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score, cross_val_predict
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.ml.training.trainer import MLTrainer
from app.ml.inference.predictor import MLPredictor
from metrics import calculate_mape, calculate_smape, calculate_coverage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Comprehensive model evaluation utility."""
    
    def __init__(self, model_dir: str = "backend/app/ml/models", data_dir: str = "data/processed"):
        self.model_dir = model_dir
        self.data_dir = data_dir
        self.predictor = MLPredictor(model_dir=model_dir)
        self.trainer = MLTrainer(data_dir=data_dir)
        self.evaluation_results = {}
    
    def evaluate_all(self) -> Dict[str, Any]:
        """Evaluate all models."""
        logger.info("Starting evaluation of all models...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'models': {}
        }
        
        # Evaluate each model
        try:
            results['models']['demand_forecasting'] = self.evaluate_demand_forecasting()
        except Exception as e:
            logger.error(f"Failed to evaluate demand forecasting: {e}")
            results['models']['demand_forecasting'] = {'error': str(e)}
        
        try:
            results['models']['inventory_risk'] = self.evaluate_inventory_risk()
        except Exception as e:
            logger.error(f"Failed to evaluate inventory risk: {e}")
            results['models']['inventory_risk'] = {'error': str(e)}
        
        try:
            results['models']['supplier_delay'] = self.evaluate_supplier_delay()
        except Exception as e:
            logger.error(f"Failed to evaluate supplier delay: {e}")
            results['models']['supplier_delay'] = {'error': str(e)}
        
        try:
            results['models']['cost_anomaly'] = self.evaluate_cost_anomaly()
        except Exception as e:
            logger.error(f"Failed to evaluate cost anomaly: {e}")
            results['models']['cost_anomaly'] = {'error': str(e)}
        
        # Calculate overall summary
        results['summary'] = self._calculate_summary(results['models'])
        
        self.evaluation_results = results
        return results
    
    def evaluate_demand_forecasting(self) -> Dict[str, Any]:
        """Evaluate demand forecasting model."""
        logger.info("Evaluating demand forecasting model...")
        
        try:
            # Load test data
            data = self.trainer.load_data("demand_data")
            
            # Get model predictions
            from app.ml.models.demand_forecasting import DemandForecastingModel
            model_path = Path(self.model_dir) / "demand_forecasting_model.pkl"
            model = DemandForecastingModel.load_model(str(model_path))
            
            # Prepare features
            X, y = model.prepare_features(data)
            
            # Make predictions
            predictions = model.predict(data)
            
            # Calculate metrics
            rmse = np.sqrt(mean_squared_error(y, predictions))
            mae = mean_absolute_error(y, predictions)
            r2 = r2_score(y, predictions)
            mape = calculate_mape(y.values, predictions)
            
            # Cross-validation
            cv_scores = cross_val_score(model.rf_model, X, y, cv=5, scoring='neg_mean_squared_error')
            cv_rmse = np.sqrt(-cv_scores.mean())
            
            return {
                'model_type': 'regression',
                'metrics': {
                    'rmse': round(rmse, 4),
                    'mae': round(mae, 4),
                    'r2': round(r2, 4),
                    'mape': round(mape, 4) if not np.isnan(mape) else None,
                    'cv_rmse': round(cv_rmse, 4),
                    'cv_std': round(np.sqrt(-cv_scores).std(), 4)
                },
                'sample_size': len(y),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Demand forecasting evaluation failed: {e}")
            return {'error': str(e), 'status': 'failed'}
    
    def evaluate_inventory_risk(self) -> Dict[str, Any]:
        """Evaluate inventory risk classifier."""
        logger.info("Evaluating inventory risk classifier...")
        
        try:
            # Load test data
            data = self.trainer.load_data("classification_data")
            
            # Get model predictions
            from app.ml.models.inventory_risk_classifier import InventoryRiskClassifier
            model_path = Path(self.model_dir) / "inventory_risk_classifier.pkl"
            model = InventoryRiskClassifier.load_model(str(model_path))
            
            # Prepare features
            X, y = model.prepare_features(data)
            
            # Make predictions
            predictions = model.predict(data)
            
            # Calculate metrics
            accuracy = accuracy_score(y, predictions)
            precision = precision_score(y, predictions, average='weighted', zero_division=0)
            recall = recall_score(y, predictions, average='weighted', zero_division=0)
            f1 = f1_score(y, predictions, average='weighted', zero_division=0)
            
            # Cross-validation
            cv_scores = cross_val_score(model.rf_model, X, y, cv=5, scoring='accuracy')
            
            # Confusion matrix
            cm = confusion_matrix(y, predictions)
            
            return {
                'model_type': 'classification',
                'metrics': {
                    'accuracy': round(accuracy, 4),
                    'precision': round(precision, 4),
                    'recall': round(recall, 4),
                    'f1_score': round(f1, 4),
                    'cv_accuracy': round(cv_scores.mean(), 4),
                    'cv_std': round(cv_scores.std(), 4)
                },
                'confusion_matrix': cm.tolist(),
                'classes': list(model.label_encoder.classes_),
                'sample_size': len(y),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Inventory risk evaluation failed: {e}")
            return {'error': str(e), 'status': 'failed'}
    
    def evaluate_supplier_delay(self) -> Dict[str, Any]:
        """Evaluate supplier delay predictor."""
        logger.info("Evaluating supplier delay predictor...")
        
        try:
            # Load test data
            data = self.trainer.load_data("classification_data")
            
            # Get model predictions
            from app.ml.models.supplier_delay_predictor import SupplierDelayPredictor
            model_path = Path(self.model_dir) / "supplier_delay_predictor.pkl"
            model = SupplierDelayPredictor.load_model(str(model_path))
            
            # Prepare features
            X, y = model.prepare_features(data)
            
            # Make predictions
            predictions = model.predict(data)
            probabilities = model.predict_proba(data)
            
            # Calculate metrics
            accuracy = accuracy_score(y, predictions)
            precision = precision_score(y, predictions, average='binary', zero_division=0)
            recall = recall_score(y, predictions, average='binary', zero_division=0)
            f1 = f1_score(y, predictions, average='binary', zero_division=0)
            
            # ROC-AUC (if we have probabilities)
            roc_auc = None
            if probabilities is not None and len(np.unique(y)) == 2:
                try:
                    roc_auc = roc_auc_score(y, probabilities[:, 1])
                except:
                    pass
            
            # Cross-validation
            cv_scores = cross_val_score(model.xgb_model, X, y, cv=5, scoring='accuracy')
            
            return {
                'model_type': 'binary_classification',
                'metrics': {
                    'accuracy': round(accuracy, 4),
                    'precision': round(precision, 4),
                    'recall': round(recall, 4),
                    'f1_score': round(f1, 4),
                    'roc_auc': round(roc_auc, 4) if roc_auc else None,
                    'cv_accuracy': round(cv_scores.mean(), 4),
                    'cv_std': round(cv_scores.std(), 4)
                },
                'confusion_matrix': confusion_matrix(y, predictions).tolist(),
                'sample_size': len(y),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Supplier delay evaluation failed: {e}")
            return {'error': str(e), 'status': 'failed'}
    
    def evaluate_cost_anomaly(self) -> Dict[str, Any]:
        """Evaluate cost anomaly detector."""
        logger.info("Evaluating cost anomaly detector...")
        
        try:
            # Load test data
            data = self.trainer.load_data("classification_data")
            
            # Get model predictions
            from app.ml.models.cost_anomaly_detector import CostAnomalyDetector
            model_path = Path(self.model_dir) / "cost_anomaly_detector.pkl"
            model = CostAnomalyDetector.load_model(str(model_path))
            
            # Prepare features and make predictions
            X = model.prepare_features(data)
            predictions = model.predict(data)
            scores = model.score(data)
            
            # Calculate anomaly statistics
            n_anomalies = sum(predictions == -1)
            n_normal = sum(predictions == 1)
            anomaly_percentage = n_anomalies / len(predictions) * 100
            
            return {
                'model_type': 'anomaly_detection',
                'metrics': {
                    'anomaly_count': int(n_anomalies),
                    'normal_count': int(n_normal),
                    'anomaly_percentage': round(anomaly_percentage, 2),
                    'avg_anomaly_score': round(np.mean(scores), 4),
                    'score_std': round(np.std(scores), 4)
                },
                'sample_size': len(predictions),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Cost anomaly evaluation failed: {e}")
            return {'error': str(e), 'status': 'failed'}
    
    def _calculate_summary(self, models: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate summary statistics across all models."""
        successful = sum(1 for m in models.values() if m.get('status') == 'success')
        failed = len(models) - successful
        
        return {
            'total_models': len(models),
            'successful_evaluations': successful,
            'failed_evaluations': failed,
            'evaluation_timestamp': datetime.now().isoformat()
        }
    
    def generate_report(self, output_path: str = None):
        """Generate evaluation report."""
        if not self.evaluation_results:
            self.evaluate_all()
        
        if output_path:
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(path, 'w') as f:
                json.dump(self.evaluation_results, f, indent=2, default=str)
            
            logger.info(f"Report saved to {output_path}")
        
        return self.evaluation_results


def print_evaluation_report(results: Dict[str, Any]):
    """Pretty print evaluation report."""
    print("\n" + "=" * 70)
    print(" 📊 MODEL EVALUATION REPORT")
    print("=" * 70)
    print(f" Generated: {results.get('timestamp', 'N/A')}")
    print("-" * 70)
    
    for model_name, model_results in results.get('models', {}).items():
        print(f"\n🔹 {model_name.replace('_', ' ').title()}")
        print("-" * 40)
        
        if model_results.get('status') == 'failed':
            print(f"   ❌ Error: {model_results.get('error', 'Unknown error')}")
            continue
        
        metrics = model_results.get('metrics', {})
        model_type = model_results.get('model_type', 'unknown')
        
        if model_type == 'regression':
            print(f"   RMSE:      {metrics.get('rmse', 'N/A')}")
            print(f"   MAE:       {metrics.get('mae', 'N/A')}")
            print(f"   R²:        {metrics.get('r2', 'N/A')}")
            print(f"   MAPE:      {metrics.get('mape', 'N/A')}")
            print(f"   CV RMSE:   {metrics.get('cv_rmse', 'N/A')} (±{metrics.get('cv_std', 'N/A')})")
        
        elif model_type in ['classification', 'binary_classification']:
            print(f"   Accuracy:  {metrics.get('accuracy', 'N/A')}")
            print(f"   Precision: {metrics.get('precision', 'N/A')}")
            print(f"   Recall:    {metrics.get('recall', 'N/A')}")
            print(f"   F1 Score:  {metrics.get('f1_score', 'N/A')}")
            if metrics.get('roc_auc'):
                print(f"   ROC-AUC:   {metrics.get('roc_auc')}")
            print(f"   CV Acc:    {metrics.get('cv_accuracy', 'N/A')} (±{metrics.get('cv_std', 'N/A')})")
        
        elif model_type == 'anomaly_detection':
            print(f"   Anomalies: {metrics.get('anomaly_count', 'N/A')}")
            print(f"   Normal:    {metrics.get('normal_count', 'N/A')}")
            print(f"   Anomaly %: {metrics.get('anomaly_percentage', 'N/A')}%")
        
        print(f"   Samples:   {model_results.get('sample_size', 'N/A')}")
        print(f"   Status:    ✅ Success")
    
    # Summary
    summary = results.get('summary', {})
    print("\n" + "=" * 70)
    print(" 📋 SUMMARY")
    print("-" * 70)
    print(f"   Total Models:     {summary.get('total_models', 'N/A')}")
    print(f"   ✅ Successful:    {summary.get('successful_evaluations', 'N/A')}")
    print(f"   ❌ Failed:        {summary.get('failed_evaluations', 'N/A')}")
    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate trained ML models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Evaluate all models
    python evaluate_models.py --all
    
    # Evaluate specific model
    python evaluate_models.py --model demand_forecasting
    
    # Save report to file
    python evaluate_models.py --all --output evaluation_report.json
        """
    )
    
    parser.add_argument(
        '--all',
        action='store_true',
        help='Evaluate all models'
    )
    parser.add_argument(
        '--model',
        type=str,
        choices=['demand_forecasting', 'inventory_risk', 'supplier_delay', 'cost_anomaly'],
        help='Evaluate specific model'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Output file path for JSON report'
    )
    parser.add_argument(
        '--model-dir',
        type=str,
        default='backend/app/ml/models',
        help='Path to model directory'
    )
    parser.add_argument(
        '--data-dir',
        type=str,
        default='data/processed',
        help='Path to data directory'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if not args.all and not args.model:
        parser.error("Please specify --all or --model")
    
    # Initialize evaluator
    evaluator = ModelEvaluator(model_dir=args.model_dir, data_dir=args.data_dir)
    
    try:
        if args.all:
            results = evaluator.evaluate_all()
        else:
            results = {
                'timestamp': datetime.now().isoformat(),
                'models': {}
            }
            method_mapping = {
                'demand_forecasting': evaluator.evaluate_demand_forecasting,
                'inventory_risk': evaluator.evaluate_inventory_risk,
                'supplier_delay': evaluator.evaluate_supplier_delay,
                'cost_anomaly': evaluator.evaluate_cost_anomaly,
            }
            results['models'][args.model] = method_mapping[args.model]()
        
        # Print report
        print_evaluation_report(results)
        
        # Save if output specified
        if args.output:
            evaluator.evaluation_results = results
            evaluator.generate_report(args.output)
        
        # Exit with error if any failures
        models = results.get('models', {})
        failures = sum(1 for m in models.values() if m.get('status') != 'success')
        if failures > 0:
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
