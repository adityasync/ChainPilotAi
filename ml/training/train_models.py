#!/usr/bin/env python3
"""
ML Model Training CLI

This script provides a command-line interface to train all ML models
in the supply chain platform. It wraps the training functionality from
the backend ML module.

Usage:
    python train_models.py --all
    python train_models.py --model demand_forecasting
    python train_models.py --model inventory_risk --config config.yaml
"""

import argparse
import logging
import sys
import os
import yaml
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.ml.training.trainer import MLTrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("training.log")
    ]
)
logger = logging.getLogger(__name__)


def load_config(config_path: str = None) -> dict:
    """Load configuration from YAML file."""
    if config_path is None:
        config_path = Path(__file__).parent / "config.yaml"
    
    if not Path(config_path).exists():
        logger.warning(f"Config file not found: {config_path}. Using defaults.")
        return {}
    
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def train_model(model_name: str, trainer: MLTrainer) -> dict:
    """Train a specific model."""
    model_mapping = {
        'demand_forecasting': trainer.train_demand_forecasting,
        'inventory_risk': trainer.train_inventory_risk_classifier,
        'supplier_delay': trainer.train_supplier_delay_predictor,
        'cost_anomaly': trainer.train_cost_anomaly_detector,
    }
    
    if model_name not in model_mapping:
        raise ValueError(f"Unknown model: {model_name}. Available: {list(model_mapping.keys())}")
    
    logger.info(f"Training model: {model_name}")
    return model_mapping[model_name]()


def train_all_models(trainer: MLTrainer) -> dict:
    """Train all models."""
    logger.info("Training all models...")
    return trainer.train_all_models()


def print_results(results: dict):
    """Pretty print training results."""
    print("\n" + "=" * 60)
    print(" TRAINING RESULTS")
    print("=" * 60)
    
    for model_name, result in results.items():
        print(f"\n📊 {model_name.replace('_', ' ').title()}")
        print("-" * 40)
        
        if 'error' in result:
            print(f"   ❌ Error: {result['error']}")
            continue
        
        # Print metrics based on model type
        if 'random_forest' in result:
            rf = result['random_forest']
            if 'rmse' in rf:
                print(f"   Random Forest:")
                print(f"      RMSE: {rf['rmse']:.4f}")
                print(f"      MAE:  {rf['mae']:.4f}")
                print(f"      R²:   {rf['r2']:.4f}")
            elif 'accuracy' in rf:
                print(f"   Random Forest Accuracy: {rf['accuracy']:.4f}")
        
        if 'xgboost' in result:
            xgb = result['xgboost']
            if 'roc_auc' in xgb:
                print(f"   XGBoost ROC-AUC: {xgb['roc_auc']:.4f}")
            if 'accuracy' in xgb:
                print(f"   XGBoost Accuracy: {xgb['accuracy']:.4f}")
        
        if 'logistic_regression' in result:
            lr = result['logistic_regression']
            if 'accuracy' in lr:
                print(f"   Logistic Regression Accuracy: {lr['accuracy']:.4f}")
        
        if 'anomaly_percentage' in result:
            print(f"   Anomaly Percentage: {result['anomaly_percentage']:.2f}%")
        
        print("   ✅ Model saved successfully")
    
    print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Train ML models for Supply Chain SaaS Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Train all models
    python train_models.py --all
    
    # Train specific model
    python train_models.py --model demand_forecasting
    
    # Train with custom config
    python train_models.py --all --config custom_config.yaml
    
    # Train with custom data directory
    python train_models.py --all --data-dir /path/to/data
        """
    )
    
    parser.add_argument(
        '--all',
        action='store_true',
        help='Train all models'
    )
    parser.add_argument(
        '--model',
        type=str,
        choices=['demand_forecasting', 'inventory_risk', 'supplier_delay', 'cost_anomaly'],
        help='Train a specific model'
    )
    parser.add_argument(
        '--config',
        type=str,
        default=None,
        help='Path to configuration YAML file'
    )
    parser.add_argument(
        '--data-dir',
        type=str,
        default='data/processed',
        help='Path to processed data directory'
    )
    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if not args.all and not args.model:
        parser.error("Please specify --all or --model")
    
    # Load configuration
    config = load_config(args.config)
    
    # Override data directory if specified
    data_dir = args.data_dir or config.get('data_dir', 'data/processed')
    
    # Initialize trainer
    trainer = MLTrainer(data_dir=data_dir)
    
    try:
        if args.all:
            results = train_all_models(trainer)
        else:
            results = {args.model: train_model(args.model, trainer)}
        
        print_results(results)
        
        # Evaluate models
        evaluations = trainer.evaluate_models()
        
        # Count successes and failures
        successes = sum(1 for r in results.values() if 'error' not in r)
        failures = len(results) - successes
        
        if failures > 0:
            logger.warning(f"Training completed with {failures} failure(s)")
            sys.exit(1)
        else:
            logger.info(f"All {successes} model(s) trained successfully!")
            sys.exit(0)
            
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
