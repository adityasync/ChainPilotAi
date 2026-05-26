from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
import traceback
from datetime import datetime

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..services.inventory_service import get_products_by_company
from ..services.supplier_service import get_suppliers_by_company
from ..ml.inference.predictor import MLPredictor
from ..ml.evaluation.enhanced_insight_engine import EnhancedInsightEngine
from ..models.ml_models import Prediction, Insight
from ..models.product_inventory import Product
from ..models.supplier_shipment import Supplier

logger = logging.getLogger(__name__)
router = APIRouter()

# Global predictor and insight engine instances
predictor = MLPredictor()
insight_engine = EnhancedInsightEngine(predictor)


@router.get("/demand-forecast/{product_id}")
def get_demand_forecast(
    product_id: int,
    date: str,  # Expected format: YYYY-MM-DD
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get demand forecast for a specific product on a specific date
    """
    company_id = get_current_user_company_id(db, current_user)

    try:
        # Validate date format
        forecast_date = datetime.strptime(date, "%Y-%m-%d")

        # Check if the product belongs to the user's company
        product = db.query(Product).filter(Product.id == product_id, Product.company_id == company_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found or does not belong to your company")

        # Get demand forecast
        forecast = predictor.predict_demand(str(product_id), forecast_date)
        forecast_val = float(forecast)

        # Store prediction in database
        prediction = Prediction(
            company_id=company_id,
            entity_type="product",
            entity_id=product_id,
            prediction_type="demand_forecast",
            prediction_value=forecast_val
        )
        db.add(prediction)
        db.commit()

        return {
            "product_id": product_id,
            "forecast_date": date,
            "predicted_demand": forecast_val
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error getting demand forecast: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating demand forecast")


@router.get("/inventory-risk/{product_id}")
def get_inventory_risk(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get inventory risk classification for a specific product
    """
    company_id = get_current_user_company_id(db, current_user)

    # Check if the product belongs to the user's company
    product = db.query(Product).filter(Product.id == product_id, Product.company_id == company_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or does not belong to your company")

    try:
        # Prepare product data for prediction
        # Aggregate stock from all warehouses
        total_stock = sum(item.current_stock for item in product.inventory_items) if product.inventory_items else 0
        
        product_data = {
            'id': product.id,
            'Availability': total_stock,
            'Number of products sold': 0,  # Placeholder - would come from historical data
            'Revenue generated': 0,  # Placeholder - would come from historical data
            'Stock levels': total_stock,
            'Lead times': 0,  # Placeholder - would come from supplier data
            'Order quantities': 0,  # Placeholder - would come from order history
            'Shipping costs': 0,  # Placeholder - would come from shipping data
            'Price': product.unit_cost
        }

        # Get inventory risk prediction
        risk_label, probas = predictor.predict_inventory_risk(product_data)
        # Fix: Store max probability as value instead of label string (which breaks float column)
        risk_score = float(max(probas))

        # Store prediction in database
        prediction = Prediction(
            company_id=company_id,
            entity_type="product",
            entity_id=product_id,
            prediction_type="inventory_risk",
            prediction_value=risk_score
        )
        db.add(prediction)
        db.commit()

        return {
            "product_id": product_id,
            "risk_label": risk_label,
            "probabilities": [float(p) for p in probas]
        }
    except Exception as e:
        logger.error(f"Error getting inventory risk: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating inventory risk assessment")


@router.get("/supplier-delay-risk/{supplier_id}")
def get_supplier_delay_risk(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get delay risk prediction for a specific supplier
    """
    company_id = get_current_user_company_id(db, current_user)

    # Check if the supplier belongs to the user's company
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.company_id == company_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found or does not belong to your company")

    try:
        # Prepare supplier data for prediction
        supplier_data = {
            'id': supplier.id,
            'Lead times': supplier.avg_lead_time or 0,
            'Order quantities': 0,  # Placeholder - would come from order history
            'Shipping costs': 0,  # Placeholder - would come from shipping data
            'Price': 0,  # Placeholder - would come from order data
            'Availability': 0,  # Placeholder - would come from inventory data
            'Number of products sold': 0  # Placeholder - would come from sales data
        }

        # Get supplier delay prediction
        delay_prediction, delay_probability = predictor.predict_supplier_delay(supplier_data)
        # Fix: Cast numpy types to python native types
        delay_prob = float(delay_probability)

        # Store prediction in database
        prediction = Prediction(
            company_id=company_id,
            entity_type="supplier",
            entity_id=supplier_id,
            prediction_type="delay_risk",
            prediction_value=delay_prob
        )
        db.add(prediction)
        db.commit()

        return {
            "supplier_id": supplier_id,
            "delay_risk": bool(delay_prediction),
            "delay_probability": float(delay_probability)
        }
    except Exception as e:
        logger.error(f"Error getting supplier delay risk: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating supplier delay risk assessment")


@router.post("/run-analysis")
def run_ml_analysis(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run a full ML analysis for the user's company and generate enhanced insights
    """
    company_id = get_current_user_company_id(db, current_user)

    try:
        # Get products for the company
        products = db.query(Product).filter(Product.company_id == company_id).all()
        product_data = []
        for prod in products:
            # Aggregate stock from all warehouses
            total_stock = sum(item.current_stock for item in prod.inventory_items) if prod.inventory_items else 0
            
            product_data.append({
                'id': prod.id,
                'Availability': total_stock,
                'Number of products sold': 0,  # Would need to aggregate from orders
                'Revenue generated': 0,  # Would need to calculate from orders
                'Stock levels': total_stock,
                'Lead times': 0,  # Would come from supplier data
                'Order quantities': 0,  # Would come from order history
                'Shipping costs': 0,  # Would come from shipping data
                'Price': prod.unit_cost
            })

        # Get suppliers for the company
        suppliers = db.query(Supplier).filter(Supplier.company_id == company_id).all()
        supplier_data = []
        for sup in suppliers:
            supplier_data.append({
                'id': sup.id,
                'Lead times': sup.avg_lead_time or 0,
                'Order quantities': 0,  # Would come from order history
                'Shipping costs': 0,  # Would come from shipping data
                'Price': 0,  # Would come from order data
                'Availability': 0,  # Would come from inventory data
                'Number of products sold': 0  # Would come from sales data
            })

        # Run the full enhanced analysis
        # Note: run_enhanced_analysis might need similar type casting fixes internally if it creates Predictions
        results = insight_engine.run_enhanced_analysis(
            db=db,
            company_id=company_id,
            product_data=product_data,
            supplier_data=supplier_data
        )

        return {
            "message": "Enhanced ML analysis completed successfully",
            "predictions_count": results['predictions_count'],
            "insights_count": results['insights_count']
        }
    except Exception as e:
        logger.error(f"Error running enhanced ML analysis: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Error running enhanced ML analysis")


@router.get("/insights")
def get_prioritized_insights(
    severity: str = None,
    category: str = None,
    status: str = None,
    limit: int = 50,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get prioritized insights for the user's company
    """
    company_id = get_current_user_company_id(db, current_user)

    # Use the enhanced insight engine to get prioritized insights
    insights = insight_engine.get_prioritized_insights(
        db=db,
        company_id=company_id,
        severity=severity,
        category=category,
        status=status,
        limit=limit
    )

    return insights


@router.get("/insights/action-required")
def get_action_required_insights(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get insights that require immediate action (high and critical severity)
    """
    company_id = get_current_user_company_id(db, current_user)

    # Use the enhanced insight engine to get prioritized insights
    insights = insight_engine.get_prioritized_insights(
        db=db,
        company_id=company_id,
        severity="high",
        limit=20
    )

    critical_insights = insight_engine.get_prioritized_insights(
        db=db,
        company_id=company_id,
        severity="critical",
        limit=20
    )

    # Combine and sort by priority
    all_action_insights = insights + critical_insights
    all_action_insights.sort(key=lambda x: x['priority_score'], reverse=True)

    return all_action_insights[:20]  # Return top 20 action-required insights


@router.post("/insights/{insight_id}/acknowledge")
def acknowledge_insight(
    insight_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Acknowledge an insight (mark as seen)
    """
    company_id = get_current_user_company_id(db, current_user)

    try:
        insight_engine.acknowledge_insight(db, insight_id, company_id)
        return {"message": f"Insight {insight_id} acknowledged successfully"}
    except Exception as e:
        logger.error(f"Error acknowledging insight: {str(e)}")
        raise HTTPException(status_code=500, detail="Error acknowledging insight")


@router.post("/insights/{insight_id}/resolve")
def resolve_insight(
    insight_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Resolve an insight (mark as addressed)
    """
    company_id = get_current_user_company_id(db, current_user)

    try:
        insight_engine.resolve_insight(db, insight_id, company_id)
        return {"message": f"Insight {insight_id} resolved successfully"}
    except Exception as e:
        logger.error(f"Error resolving insight: {str(e)}")
        raise HTTPException(status_code=500, detail="Error resolving insight")


@router.get("/predictions")
def get_predictions(
    entity_type: str = None,
    prediction_type: str = None,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get predictions for the user's company
    """
    company_id = get_current_user_company_id(db, current_user)

    query = db.query(Prediction).filter(Prediction.company_id == company_id)

    if entity_type:
        query = query.filter(Prediction.entity_type == entity_type)

    if prediction_type:
        query = query.filter(Prediction.prediction_type == prediction_type)

    predictions = query.order_by(Prediction.created_at.desc()).limit(limit).all()

    return [{
        "id": pred.id,
        "entity_type": pred.entity_type,
        "entity_id": pred.entity_id,
        "prediction_type": pred.prediction_type,
        "prediction_value": pred.prediction_value,
        "created_at": pred.created_at
    } for pred in predictions]