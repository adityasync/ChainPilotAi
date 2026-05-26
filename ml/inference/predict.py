#!/usr/bin/env python3
"""
ML Prediction CLI

This script provides a command-line interface to make predictions
using trained ML models in the supply chain platform.

Usage:
    python predict.py demand --product-id 123 --date 2024-03-15
    python predict.py inventory-risk --current-stock 100 --reorder-point 50
    python predict.py supplier-delay --lead-time 7 --reliability 85
    python predict.py cost-anomaly --shipping-cost 150 --price 500
"""

import argparse
import logging
import sys
import json
from pathlib import Path
from datetime import datetime

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.ml.inference.predictor import MLPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def predict_demand(predictor: MLPredictor, args):
    """Predict demand for a product on a specific date."""
    try:
        date = datetime.strptime(args.date, "%Y-%m-%d")
        prediction = predictor.predict_demand(args.product_id, date)
        
        result = {
            "model": "demand_forecasting",
            "product_id": args.product_id,
            "date": args.date,
            "predicted_demand": round(prediction, 2)
        }
        
        print_result(result)
        return result
        
    except Exception as e:
        logger.error(f"Demand prediction failed: {str(e)}")
        sys.exit(1)


def predict_inventory_risk(predictor: MLPredictor, args):
    """Predict inventory risk for given product data."""
    try:
        product_data = {
            "Stock levels": args.current_stock,
            "Availability": args.availability or (args.current_stock / args.max_stock * 100 if args.max_stock else 100),
            "Number of products sold": args.sold or 0,
            "Revenue generated": args.revenue or 0,
            "Lead times": args.lead_time or 7,
            "Order quantities": args.order_qty or 0,
            "Shipping costs": args.shipping_cost or 0,
            "Price": args.price or 0,
        }
        
        risk_label, probabilities = predictor.predict_inventory_risk(product_data)
        
        result = {
            "model": "inventory_risk_classifier",
            "input": product_data,
            "predicted_risk": risk_label,
            "probabilities": {
                f"class_{i}": round(p, 4) 
                for i, p in enumerate(probabilities) if probabilities is not None
            } if probabilities is not None else None
        }
        
        print_result(result)
        return result
        
    except Exception as e:
        logger.error(f"Inventory risk prediction failed: {str(e)}")
        sys.exit(1)


def predict_supplier_delay(predictor: MLPredictor, args):
    """Predict supplier delay risk."""
    try:
        supplier_data = {
            "Lead times": args.lead_time,
            "Order quantities": args.order_qty or 100,
            "Shipping costs": args.shipping_cost or 50,
        }
        
        prediction, probability = predictor.predict_supplier_delay(supplier_data)
        
        result = {
            "model": "supplier_delay_predictor",
            "input": supplier_data,
            "will_delay": bool(prediction),
            "delay_probability": round(probability, 4)
        }
        
        print_result(result)
        return result
        
    except Exception as e:
        logger.error(f"Supplier delay prediction failed: {str(e)}")
        sys.exit(1)


def detect_cost_anomaly(predictor: MLPredictor, args):
    """Detect if cost is anomalous."""
    try:
        cost_data = {
            "Shipping costs": args.shipping_cost,
            "Price": args.price,
            "Revenue generated": args.revenue or args.price * (args.quantity or 1),
        }
        
        prediction, anomaly_score = predictor.detect_cost_anomaly(cost_data)
        
        result = {
            "model": "cost_anomaly_detector",
            "input": cost_data,
            "is_anomaly": prediction == -1,
            "anomaly_score": round(anomaly_score, 4)
        }
        
        print_result(result)
        return result
        
    except Exception as e:
        logger.error(f"Cost anomaly detection failed: {str(e)}")
        sys.exit(1)


def print_result(result: dict):
    """Pretty print prediction result."""
    print("\n" + "=" * 50)
    print(f" 📊 {result['model'].replace('_', ' ').title()}")
    print("=" * 50)
    
    if "input" in result:
        print("\nInput:")
        for key, value in result["input"].items():
            print(f"  • {key}: {value}")
    
    print("\nPrediction:")
    
    if "predicted_demand" in result:
        print(f"  📈 Predicted Demand: {result['predicted_demand']} units")
    
    if "predicted_risk" in result:
        risk_emoji = {
            "Normal": "✅",
            "Low Risk": "🟡",
            "Medium Risk": "🟠",
            "High Risk": "🔴",
            "Critical": "⛔"
        }.get(result["predicted_risk"], "❓")
        print(f"  {risk_emoji} Risk Level: {result['predicted_risk']}")
    
    if "will_delay" in result:
        delay_emoji = "⚠️" if result["will_delay"] else "✅"
        print(f"  {delay_emoji} Will Delay: {'Yes' if result['will_delay'] else 'No'}")
        print(f"  📊 Delay Probability: {result['delay_probability'] * 100:.2f}%")
    
    if "is_anomaly" in result:
        anomaly_emoji = "🚨" if result["is_anomaly"] else "✅"
        print(f"  {anomaly_emoji} Is Anomaly: {'Yes' if result['is_anomaly'] else 'No'}")
        print(f"  📊 Anomaly Score: {result['anomaly_score']}")
    
    print("\n" + "=" * 50)
    
    # Also output JSON for programmatic use
    if args.json:
        print("\nJSON Output:")
        print(json.dumps(result, indent=2))


def main():
    global args
    
    parser = argparse.ArgumentParser(
        description="Make predictions using trained ML models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Predict demand
    python predict.py demand --product-id 123 --date 2024-03-15
    
    # Predict inventory risk
    python predict.py inventory-risk --current-stock 50 --max-stock 200 --lead-time 7
    
    # Predict supplier delay
    python predict.py supplier-delay --lead-time 14 --order-qty 500 --shipping-cost 200
    
    # Detect cost anomaly
    python predict.py cost-anomaly --shipping-cost 500 --price 100 --revenue 10000
        """
    )
    
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output result as JSON'
    )
    parser.add_argument(
        '--model-dir',
        type=str,
        default='backend/app/ml/models',
        help='Path to model directory'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Prediction type')
    
    # Demand forecasting
    demand_parser = subparsers.add_parser('demand', help='Predict demand')
    demand_parser.add_argument('--product-id', type=str, required=True, help='Product ID')
    demand_parser.add_argument('--date', type=str, required=True, help='Date (YYYY-MM-DD)')
    
    # Inventory risk
    risk_parser = subparsers.add_parser('inventory-risk', help='Predict inventory risk')
    risk_parser.add_argument('--current-stock', type=float, required=True, help='Current stock level')
    risk_parser.add_argument('--max-stock', type=float, default=1000, help='Maximum stock capacity')
    risk_parser.add_argument('--availability', type=float, help='Availability percentage')
    risk_parser.add_argument('--sold', type=float, help='Number of products sold')
    risk_parser.add_argument('--revenue', type=float, help='Revenue generated')
    risk_parser.add_argument('--lead-time', type=float, help='Lead time in days')
    risk_parser.add_argument('--order-qty', type=float, help='Order quantity')
    risk_parser.add_argument('--shipping-cost', type=float, help='Shipping cost')
    risk_parser.add_argument('--price', type=float, help='Product price')
    
    # Supplier delay
    delay_parser = subparsers.add_parser('supplier-delay', help='Predict supplier delay')
    delay_parser.add_argument('--lead-time', type=float, required=True, help='Lead time in days')
    delay_parser.add_argument('--order-qty', type=float, help='Order quantity')
    delay_parser.add_argument('--shipping-cost', type=float, help='Shipping cost')
    
    # Cost anomaly
    anomaly_parser = subparsers.add_parser('cost-anomaly', help='Detect cost anomaly')
    anomaly_parser.add_argument('--shipping-cost', type=float, required=True, help='Shipping cost')
    anomaly_parser.add_argument('--price', type=float, required=True, help='Product price')
    anomaly_parser.add_argument('--revenue', type=float, help='Revenue generated')
    anomaly_parser.add_argument('--quantity', type=float, help='Quantity sold')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Initialize predictor
    predictor = MLPredictor(model_dir=args.model_dir)
    
    # Route to appropriate prediction function
    command_handlers = {
        'demand': predict_demand,
        'inventory-risk': predict_inventory_risk,
        'supplier-delay': predict_supplier_delay,
        'cost-anomaly': detect_cost_anomaly,
    }
    
    handler = command_handlers.get(args.command)
    if handler:
        handler(predictor, args)
    else:
        logger.error(f"Unknown command: {args.command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
