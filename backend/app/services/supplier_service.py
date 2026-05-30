from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, date
from ..models.supplier_shipment import Supplier, Shipment
from ..models.ml_models import Prediction
from ..schemas.supplier_shipment import SupplierCreate, SupplierUpdate, ShipmentCreate, ShipmentUpdate
from ..core.exceptions import NotFoundError, ForbiddenError


async def _get_delay_probabilities(db: AsyncSession, supplier_ids: list[int], company_id: int) -> dict[int, float]:
    """Batch-fetch latest delay_probability for a list of supplier IDs."""
    if not supplier_ids:
        return {}

    # Subquery: get the latest prediction per supplier
    subq = (
        select(
            Prediction.entity_id,
            func.max(Prediction.created_at).label("max_created"),
        )
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.entity_id.in_(supplier_ids),
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"]),
        )
        .group_by(Prediction.entity_id)
        .subquery()
    )

    stmt = (
        select(Prediction.entity_id, Prediction.prediction_value)
        .join(
            subq,
            (Prediction.entity_id == subq.c.entity_id)
            & (Prediction.created_at == subq.c.max_created),
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    return {row.entity_id: float(row.prediction_value) for row in rows}


async def create_supplier(db: AsyncSession, supplier: SupplierCreate, company_id: int):
    """Creates supplier with company association"""
    db_supplier = Supplier(**supplier.dict(), company_id=company_id)
    db.add(db_supplier)
    await db.commit()
    await db.refresh(db_supplier)
    return db_supplier


async def get_suppliers_by_company(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves suppliers filtered by company"""
    result = await db.execute(
        select(Supplier).filter(Supplier.company_id == company_id).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def count_suppliers_by_company(db: AsyncSession, company_id: int) -> int:
    result = await db.scalar(select(func.count(Supplier.id)).filter(Supplier.company_id == company_id))
    return result or 0


async def get_suppliers_with_delay(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 100) -> list[dict]:
    """Returns suppliers enriched with delay_probability."""
    suppliers = await get_suppliers_by_company(db, company_id, skip, limit)
    supplier_ids = [s.id for s in suppliers]
    delays = await _get_delay_probabilities(db, supplier_ids, company_id)

    return [
        {
            "id": s.id,
            "company_id": s.company_id,
            "supplier_name": s.supplier_name,
            "avg_lead_time": s.avg_lead_time,
            "reliability_score": s.reliability_score,
            "delay_probability": delays.get(s.id),
        }
        for s in suppliers
    ]


async def get_supplier_by_id(db: AsyncSession, supplier_id: int, company_id: int):
    """Gets specific supplier with company verification"""
    result = await db.execute(select(Supplier).filter(Supplier.id == supplier_id))
    supplier = result.scalars().first()
    if not supplier:
        raise NotFoundError("Supplier")
    if supplier.company_id != company_id:
        raise ForbiddenError("Supplier does not belong to your company")
    return supplier


async def update_supplier(db: AsyncSession, supplier_id: int, supplier_update: SupplierUpdate, company_id: int):
    """Updates supplier with company verification"""
    supplier = await get_supplier_by_id(db, supplier_id, company_id)
    update_data = supplier_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    await db.commit()
    await db.refresh(supplier)
    return supplier


async def delete_supplier(db: AsyncSession, supplier_id: int, company_id: int):
    """Deletes supplier with company verification"""
    supplier = await get_supplier_by_id(db, supplier_id, company_id)
    await db.delete(supplier)
    await db.commit()
    return supplier


async def create_shipment(db: AsyncSession, shipment: ShipmentCreate, company_id: int):
    """Creates shipment with company association"""
    # Verify that the supplier belongs to the same company
    await get_supplier_by_id(db, shipment.supplier_id, company_id)

    db_shipment = Shipment(**shipment.dict())
    db.add(db_shipment)
    await db.commit()
    await db.refresh(db_shipment)
    return db_shipment


async def get_shipments_by_company(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves shipments filtered by company"""
    result = await db.execute(
        select(Shipment)
        .join(Supplier, Shipment.supplier_id == Supplier.id)
        .filter(Supplier.company_id == company_id)
        .order_by(Shipment.expected_delivery_date.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def count_shipments_by_company(db: AsyncSession, company_id: int) -> int:
    result = await db.scalar(
        select(func.count(Shipment.id))
        .join(Supplier, Shipment.supplier_id == Supplier.id)
        .filter(Supplier.company_id == company_id)
    )
    return result or 0


async def get_shipments_by_supplier(
    db: AsyncSession,
    supplier_id: int,
    company_id: int,
    skip: int = 0,
    limit: int = 20,
):
    """Retrieves shipments for a specific supplier with company verification"""
    await get_supplier_by_id(db, supplier_id, company_id)
    result = await db.execute(
        select(Shipment)
        .filter(Shipment.supplier_id == supplier_id)
        .order_by(Shipment.expected_delivery_date.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def count_shipments_by_supplier(db: AsyncSession, supplier_id: int, company_id: int) -> int:
    await get_supplier_by_id(db, supplier_id, company_id)
    result = await db.scalar(select(func.count(Shipment.id)).filter(Shipment.supplier_id == supplier_id))
    return result or 0


async def get_shipment_by_id(db: AsyncSession, shipment_id: int, company_id: int):
    """Gets specific shipment with company verification"""
    result = await db.execute(select(Shipment).filter(Shipment.id == shipment_id))
    shipment = result.scalars().first()
    if not shipment:
        raise NotFoundError("Shipment")

    # Get the associated supplier to verify company ownership
    sup_result = await db.execute(select(Supplier).filter(Supplier.id == shipment.supplier_id))
    supplier = sup_result.scalars().first()
    if not supplier or supplier.company_id != company_id:
        raise ForbiddenError("Shipment does not belong to your company")

    return shipment


async def update_shipment(db: AsyncSession, shipment_id: int, shipment_update: ShipmentUpdate, company_id: int):
    """Updates shipment with company verification"""
    shipment = await get_shipment_by_id(db, shipment_id, company_id)

    # If supplier_id is being updated, verify it belongs to the same company
    if shipment_update.supplier_id is not None:
        await get_supplier_by_id(db, shipment_update.supplier_id, company_id)

    update_data = shipment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shipment, field, value)
    await db.commit()
    await db.refresh(shipment)
    return shipment


async def delete_shipment(db: AsyncSession, shipment_id: int, company_id: int):
    """Deletes shipment with company verification"""
    shipment = await get_shipment_by_id(db, shipment_id, company_id)
    await db.delete(shipment)
    await db.commit()
    return shipment


async def get_supplier_detail(db: AsyncSession, supplier_id: int, company_id: int):
    supplier = await get_supplier_by_id(db, supplier_id, company_id)
    shipments = await get_shipments_by_supplier(db, supplier_id, company_id, 0, 10)

    pred_result = await db.execute(
        select(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.entity_id == supplier_id,
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"]),
        )
        .order_by(Prediction.created_at.desc())
    )
    latest_delay_prediction = pred_result.scalars().first()

    return {
        "id": supplier.id,
        "company_id": supplier.company_id,
        "supplier_name": supplier.supplier_name,
        "avg_lead_time": supplier.avg_lead_time,
        "reliability_score": supplier.reliability_score,
        "delay_probability": (
            float(latest_delay_prediction.prediction_value)
            if latest_delay_prediction
            else None
        ),
        "shipments": [
            {
                "id": shipment.id,
                "supplier_id": shipment.supplier_id,
                "expected_delivery_date": shipment.expected_delivery_date,
                "actual_delivery_date": shipment.actual_delivery_date,
                "shipping_cost": shipment.shipping_cost,
            }
            for shipment in shipments
        ],
    }
