#!/usr/bin/env python3
"""
Batch Prediction Utility

This script provides batch prediction capabilities for processing
multiple records from CSV or JSON files.

Usage:
    python batch_predict.py --input data.csv --output predictions.csv --model demand
    python batch_predict.py --input data.json --output predictions.json --model inventory-risk
"""

import argparse
import logging
import sys
import json
import csv
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.ml.inference.predictor import MLPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_input_data(input_path: str) -> List[Dict[str, Any]]:
    """Load input data from CSV or JSON file."""
    path = Path(input_path)
    
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    if path.suffix.lower() == '.csv':
        with open(path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    
    elif path.suffix.lower() == '.json':
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            else:
                return [data]
    
    else:
        raise ValueError(f"Unsupported file format: {path.suffix}")


def save_output_data(output_path: str, data: List[Dict[str, Any]]):
    """Save output data to CSV or JSON file."""
    path = Path(output_path)
    
    # Create parent directories if needed
    path.parent.mkdir(parents=True, exist_ok=True)
    
    if path.suffix.lower() == '.csv':
        if not data:
            logger.warning("No data to save")
            return
        
        fieldnames = list(data[0].keys())
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    
    elif path.suffix.lower() == '.json':
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
    
    else:
        raise ValueError(f"Unsupported output format: {path.suffix}")


def batch_predict_demand(predictor: MLPredictor, records: List[Dict]) -> List[Dict]:
    """Batch predict demand for multiple records."""
    results = []
    
    for i, record in enumerate(records):
        try:
            product_id = record.get('product_id') or record.get('Product ID')
            date_str = record.get('date') or record.get('Order Date')
            
            if not product_id or not date_str:
                raise ValueError("Missing product_id or date")
            
            date = datetime.strptime(str(date_str), "%Y-%m-%d")
            prediction = predictor.predict_demand(str(product_id), date)
            
            results.append({
                **record,
                'predicted_demand': round(prediction, 2),
                'status': 'success'
            })
            
        except Exception as e:
            results.append({
                **record,
                'predicted_demand': None,
                'status': 'error',
                'error_message': str(e)
            })
        
        # Progress logging
        if (i + 1) % 100 == 0:
            logger.info(f"Processed {i + 1}/{len(records)} records")
    
    return results


def batch_predict_inventory_risk(predictor: MLPredictor, records: List[Dict]) -> List[Dict]:
    """Batch predict inventory risk for multiple records."""
    results = []
    
    for i, record in enumerate(records):
        try:
            product_data = {
                "Stock levels": float(record.get('Stock levels', 0) or record.get('current_stock', 0)),
                "Availability": float(record.get('Availability', 100)),
                "Number of products sold": float(record.get('Number of products sold', 0)),
                "Revenue generated": float(record.get('Revenue generated', 0)),
                "Lead times": float(record.get('Lead times', 7)),
                "Order quantities": float(record.get('Order quantities', 0)),
                "Shipping costs": float(record.get('Shipping costs', 0)),
                "Price": float(record.get('Price', 0)),
            }
            
            risk_label, probabilities = predictor.predict_inventory_risk(product_data)
            
            result = {
                **record,
                'predicted_risk': risk_label,
                'status': 'success'
            }
            
            if probabilities is not None:
                result['risk_probability'] = max(probabilities)
            
            results.append(result)
            
        except Exception as e:
            results.append({
                **record,
                'predicted_risk': None,
                'status': 'error',
                'error_message': str(e)
            })
        
        if (i + 1) % 100 == 0:
            logger.info(f"Processed {i + 1}/{len(records)} records")
    
    return results


def batch_predict_supplier_delay(predictor: MLPredictor, records: List[Dict]) -> List[Dict]:
    """Batch predict supplier delay for multiple records."""
    results = []
    
    for i, record in enumerate(records):
        try:
            supplier_data = {
                "Lead times": float(record.get('Lead times', 0) or record.get('lead_time', 0)),
                "Order quantities": float(record.get('Order quantities', 100)),
                "Shipping costs": float(record.get('Shipping costs', 50)),
            }
            
            prediction, probability = predictor.predict_supplier_delay(supplier_data)
            
            results.append({
                **record,
                'will_delay': bool(prediction),
                'delay_probability': round(probability, 4),
                'status': 'success'
            })
            
        except Exception as e:
            results.append({
                **record,
                'will_delay': None,
                'delay_probability': None,
                'status': 'error',
                'error_message': str(e)
            })
        
        if (i + 1) % 100 == 0:
            logger.info(f"Processed {i + 1}/{len(records)} records")
    
    return results


def batch_detect_cost_anomaly(predictor: MLPredictor, records: List[Dict]) -> List[Dict]:
    """Batch detect cost anomalies for multiple records."""
    results = []
    
    for i, record in enumerate(records):
        try:
            cost_data = {
                "Shipping costs": float(record.get('Shipping costs', 0) or record.get('shipping_cost', 0)),
                "Price": float(record.get('Price', 0) or record.get('price', 0)),
                "Revenue generated": float(record.get('Revenue generated', 0)),
            }
            
            prediction, anomaly_score = predictor.detect_cost_anomaly(cost_data)
            
            results.append({
                **record,
                'is_anomaly': prediction == -1,
                'anomaly_score': round(anomaly_score, 4),
                'status': 'success'
            })
            
        except Exception as e:
            results.append({
                **record,
                'is_anomaly': None,
                'anomaly_score': None,
                'status': 'error',
                'error_message': str(e)
            })
        
        if (i + 1) % 100 == 0:
            logger.info(f"Processed {i + 1}/{len(records)} records")
    
    return results


def print_summary(results: List[Dict]):
    """Print batch prediction summary."""
    total = len(results)
    successes = sum(1 for r in results if r.get('status') == 'success')
    failures = total - successes
    
    print("\n" + "=" * 50)
    print(" 📊 Batch Prediction Summary")
    print("=" * 50)
    print(f"  Total Records:    {total}")
    print(f"  ✅ Successful:    {successes}")
    print(f"  ❌ Failed:        {failures}")
    print(f"  Success Rate:     {successes/total*100:.1f}%" if total > 0 else "  N/A")
    print("=" * 50 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Batch prediction utility for ML models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Batch demand prediction from CSV
    python batch_predict.py --model demand --input orders.csv --output predictions.csv
    
    # Batch inventory risk from JSON
    python batch_predict.py --model inventory-risk --input products.json --output risks.json
    
    # Batch supplier delay with custom model directory
    python batch_predict.py --model supplier-delay --input suppliers.csv --output delays.csv --model-dir /path/to/models
        """
    )
    
    parser.add_argument(
        '--model',
        type=str,
        required=True,
        choices=['demand', 'inventory-risk', 'supplier-delay', 'cost-anomaly'],
        help='Model type for prediction'
    )
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Input file path (CSV or JSON)'
    )
    parser.add_argument(
        '--output',
        type=str,
        required=True,
        help='Output file path (CSV or JSON)'
    )
    parser.add_argument(
        '--model-dir',
        type=str,
        default='backend/app/ml/models',
        help='Path to model directory'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Load input data
        logger.info(f"Loading data from {args.input}")
        records = load_input_data(args.input)
        logger.info(f"Loaded {len(records)} records")
        
        # Initialize predictor
        logger.info("Initializing predictor...")
        predictor = MLPredictor(model_dir=args.model_dir)
        
        # Run batch predictions
        model_handlers = {
            'demand': batch_predict_demand,
            'inventory-risk': batch_predict_inventory_risk,
            'supplier-delay': batch_predict_supplier_delay,
            'cost-anomaly': batch_detect_cost_anomaly,
        }
        
        handler = model_handlers[args.model]
        logger.info(f"Running batch predictions with {args.model} model...")
        results = handler(predictor, records)
        
        # Save results
        logger.info(f"Saving results to {args.output}")
        save_output_data(args.output, results)
        
        # Print summary
        print_summary(results)
        
        # Exit with error if any failures
        failures = sum(1 for r in results if r.get('status') != 'success')
        if failures > 0:
            logger.warning(f"{failures} predictions failed")
            sys.exit(1)
        
        logger.info("Batch prediction completed successfully!")
        
    except Exception as e:
        logger.error(f"Batch prediction failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
