import json
import tiktoken
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ...models.product_inventory import Product, Inventory
from ...models.supplier_shipment import Supplier, Shipment
from ...models.order import Order
from ...models.ml_models import Prediction

# Token budget per SRS CON-06
MAX_CONTEXT_TOKENS = 3000

# Use cl100k_base (GPT-4/3.5 encoding) as a reasonable approximation for GLM
_encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    """Count tokens in a string using tiktoken."""
    return len(_encoder.encode(text))


def truncate_to_budget(context: dict, max_tokens: int = MAX_CONTEXT_TOKENS) -> dict:
    """
    Truncate context to fit within the token budget.
    Progressively removes items from lists (predictions first, then suppliers, then inventory).
    Orders summary is always kept (it's small and high-value).
    """
    serialized = json.dumps(context, default=str)
    if count_tokens(serialized) <= max_tokens:
        return context

    # Work on a copy — preserve orders (small, high-value)
    ctx = {
        "inventory": list(context.get("inventory", [])),
        "suppliers": list(context.get("suppliers", [])),
        "predictions": list(context.get("predictions", [])),
        "orders": context.get("orders", {}),
    }

    # Progressive truncation: remove from predictions first, then suppliers, then inventory
    for key in ["predictions", "suppliers", "inventory"]:
        while ctx[key]:
            serialized = json.dumps(ctx, default=str)
            if count_tokens(serialized) <= max_tokens:
                return ctx
            ctx[key].pop()

    return ctx


async def build_dashboard_context(db: AsyncSession, company_id: int) -> dict:
    # Fetch products ordered by those with highest-risk inventory (lowest stock relative to reorder)
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.inventory_items))
        .filter(Product.company_id == company_id)
        .limit(20)
    )
    products = result.scalars().all()

    # Sort products by risk: those with inventory below reorder point first
    def _product_risk(p):
        if not p.inventory_items:
            return 2  # no inventory = risk
        min_ratio = min(
            (item.current_stock / item.reorder_point if item.reorder_point > 0 else 1)
            for item in p.inventory_items
        )
        return -min_ratio  # lower ratio = higher risk = sorted first
    products = sorted(products, key=_product_risk)

    # Fetch suppliers ordered by latest delay prediction (highest risk first)
    delay_result = await db.execute(
        select(Prediction.entity_id, Prediction.prediction_value)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"]),
        )
        .order_by(Prediction.prediction_value.desc())
        .limit(10)
    )
    supplier_ids_with_delay = delay_result.all()
    high_risk_supplier_ids = [row.entity_id for row in supplier_ids_with_delay]
    suppliers = []
    if high_risk_supplier_ids:
        sup_result = await db.execute(select(Supplier).filter(Supplier.id.in_(high_risk_supplier_ids)))
        suppliers = list(sup_result.scalars().all())
    # Fill remaining slots with other suppliers
    if len(suppliers) < 10:
        remaining = 10 - len(suppliers)
        existing_ids = [s.id for s in suppliers]
        extra_result = await db.execute(
            select(Supplier)
            .filter(Supplier.company_id == company_id, ~Supplier.id.in_(existing_ids))
            .limit(remaining)
        )
        suppliers.extend(extra_result.scalars().all())

    pred_result = await db.execute(
        select(Prediction).filter(Prediction.company_id == company_id).order_by(Prediction.created_at.desc()).limit(20)
    )
    predictions = pred_result.scalars().all()

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

    # ── Order / sales summary ──────────────────────────────────────────
    product_ids = [p.id for p in products]

    # Top selling products by total quantity ordered
    top_products_q = await db.execute(
        select(
            Product.product_name,
            Product.category,
            func.sum(Order.quantity).label("total_qty"),
            func.count(Order.id).label("order_count"),
        )
        .join(Order, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .group_by(Product.id, Product.product_name, Product.category)
        .order_by(func.sum(Order.quantity).desc())
        .limit(10)
    )
    top_sellers = [
        {
            "product": row.product_name,
            "category": row.category,
            "total_quantity_sold": int(row.total_qty or 0),
            "order_count": int(row.order_count or 0),
        }
        for row in top_products_q.all()
    ]

    # Orders by region
    region_q = await db.execute(
        select(Order.region, func.count(Order.id).label("count"))
        .join(Product, Product.id == Order.product_id)
        .filter(Product.company_id == company_id, Order.region.isnot(None))
        .group_by(Order.region)
        .order_by(func.count(Order.id).desc())
    )
    orders_by_region = [
        {"region": row.region, "order_count": int(row.count)}
        for row in region_q.all()
    ]

    # Recent order summary
    summary_q = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(Order.quantity).label("total_quantity"),
            func.min(Order.order_date).label("earliest_order"),
            func.max(Order.order_date).label("latest_order"),
        )
        .join(Product, Product.id == Order.product_id)
        .filter(Product.company_id == company_id)
    )
    summary_row = summary_q.one()
    context["orders"] = {
        "total_orders": int(summary_row.total_orders or 0),
        "total_quantity_sold": int(summary_row.total_quantity or 0),
        "date_range": {
            "from": str(summary_row.earliest_order or ""),
            "to": str(summary_row.latest_order or ""),
        },
        "top_products": top_sellers,
        "by_region": orders_by_region,
    }

    # Enforce token budget per SRS CON-06
    return truncate_to_budget(context)


async def build_insights_context(db: AsyncSession, company_id: int) -> dict:
    # Just reuse dashboard context for now, or make a slightly more focused one
    return await build_dashboard_context(db, company_id)


async def build_supplier_context(db: AsyncSession, supplier_id: int, company_id: int) -> dict:
    result = await db.execute(
        select(Supplier).filter(Supplier.id == supplier_id, Supplier.company_id == company_id)
    )
    supplier = result.scalars().first()
    if not supplier:
        return {}

    ship_result = await db.execute(
        select(Shipment).filter(Shipment.supplier_id == supplier_id).order_by(Shipment.expected_delivery_date.desc()).limit(10)
    )
    shipments = ship_result.scalars().all()

    pred_result = await db.execute(
        select(Prediction).filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.entity_id == supplier_id,
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"])
        ).order_by(Prediction.created_at.desc())
    )
    latest_prediction = pred_result.scalars().first()

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
