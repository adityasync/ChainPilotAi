import json
import tiktoken
from sqlalchemy.orm import Session
from ...models.product_inventory import Product, Inventory
from ...models.supplier_shipment import Supplier, Shipment
from ...models.ml_models import Prediction

MAX_CONTEXT_TOKENS = 3000

_encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_encoder.encode(text))


def truncate_to_budget(context: dict, max_tokens: int = MAX_CONTEXT_TOKENS) -> dict:
    serialized = json.dumps(context, default=str)
    if count_tokens(serialized) <= max_tokens:
        return context

    ctx = {
        "inventory": list(context.get("inventory", [])),
        "suppliers": list(context.get("suppliers", [])),
        "predictions": list(context.get("predictions", [])),
    }

    for key in ["predictions", "suppliers", "inventory"]:
        while ctx[key]:
            serialized = json.dumps(ctx, default=str)
            if count_tokens(serialized) <= max_tokens:
                return ctx
            ctx[key].pop()

    return ctx


def build_dashboard_context(db: Session, company_id: int) -> dict:
    products = (
        db.query(Product)
        .filter(Product.company_id == company_id)
        .limit(20)
        .all()
    )

    def _product_risk(p):
        if not p.inventory_items:
            return 2
        min_ratio = min(
            (item.current_stock / item.reorder_point if item.reorder_point > 0 else 1)
            for item in p.inventory_items
        )
        return -min_ratio
    products = sorted(products, key=_product_risk)

    supplier_delay_rows = (
        db.query(Prediction.entity_id, Prediction.prediction_value)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"]),
        )
        .order_by(Prediction.prediction_value.desc())
        .limit(10)
        .all()
    )
    high_risk_supplier_ids = [row.entity_id for row in supplier_delay_rows]
    suppliers = []
    if high_risk_supplier_ids:
        suppliers = db.query(Supplier).filter(Supplier.id.in_(high_risk_supplier_ids)).all()
    if len(suppliers) < 10:
        remaining = 10 - len(suppliers)
        existing_ids = [s.id for s in suppliers]
        extra = (
            db.query(Supplier)
            .filter(Supplier.company_id == company_id, ~Supplier.id.in_(existing_ids))
            .limit(remaining)
            .all()
        )
        suppliers.extend(extra)

    predictions = (
        db.query(Prediction)
        .filter(Prediction.company_id == company_id)
        .order_by(Prediction.created_at.desc())
        .limit(20)
        .all()
    )

    inv_list = []
    for p in products:
        current_stock = sum(item.current_stock for item in p.inventory_items)
        reorder_point = sum(item.reorder_point for item in p.inventory_items)
        max_stock = sum(item.max_stock for item in p.inventory_items)

        status = "HEALTHY"
        if max_stock > 0 and current_stock >= max_stock:
            status = "OVERSTOCK"
        elif reorder_point > 0 and current_stock <= reorder_point * 0.5:
            status = "CRITICAL"
        elif reorder_point > 0 and current_stock <= reorder_point:
            status = "RISK"

        inv_list.append({
            "product": p.product_name,
            "category": p.category,
            "stock": current_stock,
            "reorder_point": reorder_point,
            "max_stock": max_stock,
            "status": status
        })

    supp_list = [{
        "name": s.supplier_name,
        "reliability": s.reliability_score,
        "avg_lead_time": s.avg_lead_time
    } for s in suppliers]

    pred_list = [{
        "entity_type": p.entity_type,
        "entity_id": p.entity_id,
        "type": p.prediction_type,
        "value": p.prediction_value
    } for p in predictions]

    context = {
        "inventory": inv_list,
        "suppliers": supp_list,
        "predictions": pred_list
    }

    return truncate_to_budget(context)


def build_insights_context(db: Session, company_id: int) -> dict:
    return build_dashboard_context(db, company_id)


def build_supplier_context(db: Session, supplier_id: int, company_id: int) -> dict:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.company_id == company_id).first()
    if not supplier:
        return {}

    shipments = (
        db.query(Shipment)
        .filter(Shipment.supplier_id == supplier_id)
        .order_by(Shipment.expected_delivery_date.desc())
        .limit(10)
        .all()
    )
    latest_prediction = (
        db.query(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.entity_id == supplier_id,
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"]),
        )
        .order_by(Prediction.created_at.desc())
        .first()
    )

    return {
        "supplier": {
            "name": supplier.supplier_name,
            "lead_time": supplier.avg_lead_time,
            "reliability": supplier.reliability_score
        },
        "shipments": [{
            "expected_delivery": s.expected_delivery_date.isoformat() if s.expected_delivery_date else None,
            "actual_delivery": s.actual_delivery_date.isoformat() if s.actual_delivery_date else None,
            "cost": s.shipping_cost
        } for s in shipments],
        "delay_prediction": latest_prediction.prediction_value if latest_prediction else None
    }
