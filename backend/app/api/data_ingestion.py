from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import pandas as pd
import io
import logging
from typing import Optional

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..core.exceptions import ValidationError, AppError
from ..models.product_inventory import Product, Inventory
from ..models.supplier_shipment import Supplier
from .ml_integration import insight_engine

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload/data")
async def upload_data(
    file: UploadFile = File(...),
    category_filter: Optional[str] = Form(None),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    if not file.filename.endswith(".csv"):
        raise ValidationError("Invalid file format. Please upload a CSV file.", field="file")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        df.columns = [c.strip() for c in df.columns]

        required_cols = ["Product Name", "Unit Cost", "Selling Price", "Current Stock"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValidationError(
                f"Missing required columns: {', '.join(missing_cols)}", field="file"
            )

        # Apply optional category filter at the pandas level
        if category_filter and "Category" in df.columns:
            df = df[df["Category"].str.lower() == category_filter.lower()]

        if df.empty:
            return {
                "message": "No rows matched the filter.",
                "stats": {"products_created": 0, "products_updated": 0, "inventory_records_updated": 0},
                "analysis": {"predictions_generated": 0, "insights_generated": 0},
            }

        # Fill defaults for optional columns
        df["Category"] = df.get("Category", "Uncategorized").fillna("Uncategorized")
        df["Warehouse"] = df.get("Warehouse", "Primary").fillna("Primary")
        df["Min Stock"] = df.get("Min Stock", 10).fillna(10).astype(int)
        df["Max Stock"] = df.get("Max Stock", 100).fillna(100).astype(int)
        df["Current Stock"] = df["Current Stock"].fillna(0).astype(int)
        df["Unit Cost"] = df["Unit Cost"].fillna(0).astype(float)
        df["Selling Price"] = df["Selling Price"].fillna(0).astype(float)
        df["Product Name"] = df["Product Name"].astype(str).str.strip()

        # Deduplicate: keep last row per product name (later rows win)
        df = df.drop_duplicates(subset=["Product Name"], keep="last").reset_index(drop=True)

        # ── Step 1: Bulk-read existing products for this company ──
        existing_result = await db.execute(
            select(Product).filter(Product.company_id == company_id)
        )
        existing_products = {p.product_name: p for p in existing_result.scalars().all()}

        # ── Step 2: Split into updates vs creates ──
        to_create = []
        products_updated = 0
        for _, row in df.iterrows():
            name = row["Product Name"]
            if name in existing_products:
                p = existing_products[name]
                p.unit_cost = float(row["Unit Cost"])
                p.selling_price = float(row["Selling Price"])
                p.category = row["Category"]
                products_updated += 1
            else:
                to_create.append(
                    {
                        "company_id": company_id,
                        "product_name": name,
                        "category": row["Category"],
                        "unit_cost": float(row["Unit Cost"]),
                        "selling_price": float(row["Selling Price"]),
                    }
                )

        # ── Step 3: Bulk insert new products ──
        products_created = 0
        if to_create:
            await db.execute(insert(Product), to_create)
            await db.flush()
            products_created = len(to_create)

            # Fetch newly inserted products to get their IDs
            new_names = [d["product_name"] for d in to_create]
            new_result = await db.execute(
                select(Product).filter(
                    Product.company_id == company_id,
                    Product.product_name.in_(new_names),
                )
            )
            for p in new_result.scalars().all():
                existing_products[p.product_name] = p

        # ── Step 4: Bulk-read existing inventory ──
        product_ids = list({p.id for p in existing_products.values()})
        inv_result = await db.execute(
            select(Inventory).filter(Inventory.product_id.in_(product_ids))
        )
        existing_inventory = {(inv.product_id, inv.warehouse): inv for inv in inv_result.scalars().all()}

        # ── Step 5: Build inventory updates and creates ──
        inv_to_create = []
        inventory_updated = 0
        for _, row in df.iterrows():
            name = row["Product Name"]
            product = existing_products.get(name)
            if not product:
                continue

            warehouse = row["Warehouse"]
            current_stock = int(row["Current Stock"])
            reorder_point = int(row["Min Stock"])
            max_stock = int(row["Max Stock"])
            key = (product.id, warehouse)

            if key in existing_inventory:
                inv = existing_inventory[key]
                inv.current_stock = current_stock
                inv.reorder_point = reorder_point
                inv.max_stock = max_stock
                inventory_updated += 1
            else:
                inv_to_create.append(
                    {
                        "product_id": product.id,
                        "warehouse": warehouse,
                        "current_stock": current_stock,
                        "reorder_point": reorder_point,
                        "max_stock": max_stock,
                    }
                )
                # Add to dict so duplicates in CSV don't create dup rows
                existing_inventory[key] = True  # sentinel

        # ── Step 6: Bulk insert new inventory ──
        if inv_to_create:
            await db.execute(insert(Inventory), inv_to_create)

        # Single commit for everything
        await db.commit()

        # ── Step 7: Build ML analysis payload (capped to avoid 100k loop) ──
        all_products_result = await db.execute(
            select(Product)
            .options(selectinload(Product.inventory_items))
            .filter(Product.company_id == company_id)
            .limit(1000)
        )
        products = all_products_result.scalars().all()

        product_data = []
        for prod in products:
            total_stock = sum(item.current_stock for item in prod.inventory_items) if prod.inventory_items else 0
            product_data.append(
                {
                    "id": prod.id,
                    "Availability": total_stock,
                    "Number of products sold": 0,
                    "Revenue generated": 0,
                    "Stock levels": total_stock,
                    "Lead times": 0,
                    "Order quantities": 0,
                    "Shipping costs": 0,
                    "Price": prod.unit_cost,
                }
            )

        suppliers_result = await db.execute(
            select(Supplier).filter(Supplier.company_id == company_id)
        )
        suppliers = suppliers_result.scalars().all()
        supplier_data = [
            {
                "id": sup.id,
                "Lead times": sup.avg_lead_time or 0,
                "Order quantities": 0,
                "Shipping costs": 0,
                "Price": 0,
                "Availability": 0,
                "Number of products sold": 0,
            }
            for sup in suppliers
        ]

        analysis_results = await insight_engine.run_enhanced_analysis(
            db=db,
            company_id=company_id,
            product_data=product_data,
            supplier_data=supplier_data,
        )

        return {
            "message": "Data processed and analysis completed successfully",
            "stats": {
                "products_created": products_created,
                "products_updated": products_updated,
                "inventory_records_updated": inventory_updated,
            },
            "analysis": {
                "predictions_generated": analysis_results["predictions_count"],
                "insights_generated": analysis_results["insights_count"],
            },
        }

    except AppError:
        raise
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise AppError(
            code="UPLOAD_ERROR",
            message=f"Error processing file: {str(e)}",
            status_code=500,
        )
