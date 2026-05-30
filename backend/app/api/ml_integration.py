from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List
import logging
import traceback
from datetime import datetime

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..core.exceptions import NotFoundError, ValidationError, AppError, ServiceUnavailableError
from ..services.inventory_service import get_products_by_company
from ..services.supplier_service import get_suppliers_by_company
from ..ml.inference.predictor import MLPredictor
from ..ml.evaluation.enhanced_insight_engine import EnhancedInsightEngine
from ..models.ml_models import Prediction, Insight
from ..models.product_inventory import Product
from ..models.supplier_shipment import Supplier

logger = logging.getLogger(__name__)
router = APIRouter()

predictor = MLPredictor()
insight_engine = EnhancedInsightEngine(predictor)


@router.get("/demand-forecast/{product_id}")
async def get_demand_forecast(
    product_id: int,
    date: str,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    try:
        forecast_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise ValidationError("Invalid date format. Use YYYY-MM-DD", field="date")

    result = await db.execute(select(Product).filter(Product.id == product_id, Product.company_id == company_id))
    product = result.scalars().first()
    if not product:
        raise NotFoundError("Product", product_id)

    try:
        forecast = predictor.predict_demand(str(product_id), forecast_date)
        forecast_val = float(forecast)

        prediction = Prediction(
            company_id=company_id,
            entity_type="product",
            entity_id=product_id,
            prediction_type="demand_forecast",
            prediction_value=forecast_val,
        )
        db.add(prediction)
        await db.commit()

        return {"product_id": product_id, "forecast_date": date, "predicted_demand": forecast_val}
    except ValueError as e:
        raise ServiceUnavailableError(f"ML model not loaded: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting demand forecast: {e}")
        raise AppError(code="ML_ERROR", message="Error generating demand forecast", status_code=500)


@router.get("/inventory-risk/{product_id}")
async def get_inventory_risk(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    result = await db.execute(select(Product).options(selectinload(Product.inventory_items)).filter(Product.id == product_id, Product.company_id == company_id))
    product = result.scalars().first()
    if not product:
        raise NotFoundError("Product", product_id)

    try:
        total_stock = sum(item.current_stock for item in product.inventory_items) if product.inventory_items else 0
        product_data = {
            "id": product.id,
            "Availability": total_stock,
            "Number of products sold": 0,
            "Revenue generated": 0,
            "Stock levels": total_stock,
            "Lead times": 0,
            "Order quantities": 0,
            "Shipping costs": 0,
            "Price": product.unit_cost,
        }

        risk_label, probas = predictor.predict_inventory_risk(product_data)
        risk_score = float(max(probas))

        prediction = Prediction(
            company_id=company_id,
            entity_type="product",
            entity_id=product_id,
            prediction_type="inventory_risk",
            prediction_value=risk_score,
        )
        db.add(prediction)
        await db.commit()

        return {"product_id": product_id, "risk_label": risk_label, "probabilities": [float(p) for p in probas]}
    except ValueError as e:
        raise ServiceUnavailableError(f"ML model not loaded: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting inventory risk: {e}")
        raise AppError(code="ML_ERROR", message="Error generating inventory risk assessment", status_code=500)


@router.get("/supplier-delay-risk/{supplier_id}")
async def get_supplier_delay_risk(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    result = await db.execute(select(Supplier).filter(Supplier.id == supplier_id, Supplier.company_id == company_id))
    supplier = result.scalars().first()
    if not supplier:
        raise NotFoundError("Supplier", supplier_id)

    try:
        supplier_data = {
            "id": supplier.id,
            "Lead times": supplier.avg_lead_time or 0,
            "Order quantities": 0,
            "Shipping costs": 0,
            "Price": 0,
            "Availability": 0,
            "Number of products sold": 0,
        }

        delay_prediction, delay_probability = predictor.predict_supplier_delay(supplier_data)
        delay_prob = float(delay_probability)

        prediction = Prediction(
            company_id=company_id,
            entity_type="supplier",
            entity_id=supplier_id,
            prediction_type="delay_risk",
            prediction_value=delay_prob,
        )
        db.add(prediction)
        await db.commit()

        return {"supplier_id": supplier_id, "delay_risk": bool(delay_prediction), "delay_probability": delay_prob}
    except ValueError as e:
        raise ServiceUnavailableError(f"ML model not loaded: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting supplier delay risk: {e}")
        raise AppError(code="ML_ERROR", message="Error generating supplier delay risk assessment", status_code=500)


@router.post("/cost-anomaly")
async def detect_cost_anomaly(
    cost_data: dict,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    try:
        anomaly_pred, anomaly_score = predictor.detect_cost_anomaly(cost_data)

        prediction = Prediction(
            company_id=company_id,
            entity_type="cost",
            entity_id=cost_data.get("id", 0),
            prediction_type="cost_anomaly",
            prediction_value=float(anomaly_score),
        )
        db.add(prediction)
        await db.commit()

        return {
            "is_anomaly": anomaly_pred == -1,
            "anomaly_score": float(anomaly_score),
            "prediction": int(anomaly_pred),
        }
    except ValueError as e:
        raise AppError(code="ML_ERROR", message=str(e), status_code=400)
    except Exception as e:
        logger.error(f"Error detecting cost anomaly: {e}")
        raise AppError(code="ML_ERROR", message="Error detecting cost anomaly", status_code=500)


@router.post("/run-analysis")
async def run_ml_analysis(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    try:
        products = await get_products_by_company(db, company_id)
        product_data = []
        for prod in products:
            total_stock = sum(item.current_stock for item in prod.inventory_items) if prod.inventory_items else 0
            product_data.append({
                "id": prod.id,
                "Availability": total_stock,
                "Number of products sold": 0,
                "Revenue generated": 0,
                "Stock levels": total_stock,
                "Lead times": 0,
                "Order quantities": 0,
                "Shipping costs": 0,
                "Price": prod.unit_cost,
            })

        suppliers = await get_suppliers_by_company(db, company_id)
        supplier_data = []
        for sup in suppliers:
            supplier_data.append({
                "id": sup.id,
                "Lead times": sup.avg_lead_time or 0,
                "Order quantities": 0,
                "Shipping costs": 0,
                "Price": 0,
                "Availability": 0,
                "Number of products sold": 0,
            })

        results = await insight_engine.run_enhanced_analysis(
            db=db,
            company_id=company_id,
            product_data=product_data,
            supplier_data=supplier_data,
        )

        return {
            "message": "Enhanced ML analysis completed successfully",
            "predictions_count": results["predictions_count"],
            "insights_count": results["insights_count"],
        }
    except Exception as e:
        logger.error(f"Error running enhanced ML analysis: {e}")
        logger.error(traceback.format_exc())
        raise AppError(code="ML_ERROR", message="Error running enhanced ML analysis", status_code=500)


@router.get("/insights")
async def get_prioritized_insights(
    severity: str = None,
    category: str = None,
    status: str = None,
    page: int = 1,
    page_size: int = 20,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    limit = page * page_size
    all_insights = await insight_engine.get_prioritized_insights(
        db=db, company_id=company_id, severity=severity, category=category, status=status, limit=limit,
    )
    total = len(all_insights)
    start = (page - 1) * page_size
    items = all_insights[start:start + page_size]
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/insights/action-required")
async def get_action_required_insights(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    insights = await insight_engine.get_prioritized_insights(db=db, company_id=company_id, severity="high", limit=20)
    critical_insights = await insight_engine.get_prioritized_insights(db=db, company_id=company_id, severity="critical", limit=20)
    all_action_insights = insights + critical_insights
    all_action_insights.sort(key=lambda x: x["priority_score"], reverse=True)
    return all_action_insights[:20]


@router.post("/insights/{insight_id}/acknowledge")
async def acknowledge_insight(
    insight_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    try:
        await insight_engine.acknowledge_insight(db, insight_id, company_id)
        return {"message": f"Insight {insight_id} acknowledged successfully"}
    except ValueError as e:
        raise NotFoundError("Insight", insight_id)
    except Exception as e:
        logger.error(f"Error acknowledging insight: {e}")
        raise AppError(code="INTERNAL_ERROR", message="Error acknowledging insight", status_code=500)


@router.post("/insights/{insight_id}/resolve")
async def resolve_insight(
    insight_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    try:
        await insight_engine.resolve_insight(db, insight_id, company_id)
        return {"message": f"Insight {insight_id} resolved successfully"}
    except ValueError as e:
        raise NotFoundError("Insight", insight_id)
    except Exception as e:
        logger.error(f"Error resolving insight: {e}")
        raise AppError(code="INTERNAL_ERROR", message="Error resolving insight", status_code=500)


@router.get("/predictions")
async def get_predictions(
    entity_type: str = None,
    prediction_type: str = None,
    page: int = 1,
    page_size: int = 20,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    query = select(Prediction).filter(Prediction.company_id == company_id)
    if entity_type:
        query = query.filter(Prediction.entity_type == entity_type)
    if prediction_type:
        query = query.filter(Prediction.prediction_type == prediction_type)

    from sqlalchemy import func
    count_result = await db.scalar(select(func.count()).select_from(query.subquery()))
    total = count_result or 0

    skip = (page - 1) * page_size
    result = await db.execute(query.order_by(Prediction.created_at.desc()).offset(skip).limit(page_size))
    predictions = result.scalars().all()

    return {
        "data": [
            {
                "id": pred.id,
                "entity_type": pred.entity_type,
                "entity_id": pred.entity_id,
                "prediction_type": pred.prediction_type,
                "prediction_value": pred.prediction_value,
                "created_at": pred.created_at,
            }
            for pred in predictions
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
