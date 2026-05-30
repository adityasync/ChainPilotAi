from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import pandas as pd
import io
import logging
from datetime import date
from typing import Optional

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..core.exceptions import ValidationError, AppError
from ..models.product_inventory import Product, Inventory
from ..models.supplier_shipment import Supplier, Shipment
from ..models.order import Order
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
                "stats": {"products_created": 0, "products_updated": 0, "inventory_records_updated": 0, "suppliers_created": 0, "suppliers_updated": 0, "shipments_created": 0, "orders_created": 0},
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

        # Normalize optional supplier/order columns
        has_supplier_col = "Supplier" in df.columns
        has_order_qty_col = "Order Qty" in df.columns
        if has_supplier_col:
            df["Supplier"] = df["Supplier"].astype(str).str.strip().replace({"nan": "", "None": "", "": None})
            df["Reliability"] = pd.to_numeric(df.get("Reliability"), errors="coerce")
            df["Lead Time"] = pd.to_numeric(df.get("Lead Time"), errors="coerce").fillna(0).astype(int)
        if has_order_qty_col:
            df["Order Qty"] = pd.to_numeric(df.get("Order Qty"), errors="coerce")
            df["Order Date"] = df.get("Order Date", None)
            df["Region"] = df.get("Region", None).astype(str).str.strip().replace({"nan": "", "None": "", "": None})
        has_shipment_col = "Shipment Expected" in df.columns
        if has_shipment_col:
            df["Shipment Expected"] = df.get("Shipment Expected", None)
            df["Shipment Actual"] = df.get("Shipment Actual", None)
            df["Shipment Cost"] = pd.to_numeric(df.get("Shipment Cost", 0), errors="coerce").fillna(0)

        # Keep full DataFrame for inventory/supplier/order processing (multi-row per product)
        df_full = df.copy()

        # Deduplicate by product name for product create/update (last row wins for price/category)
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
        # Use full DataFrame, dedup by (Product Name, Warehouse) — last row wins
        df_inv = df_full.drop_duplicates(subset=["Product Name", "Warehouse"], keep="last")
        inv_to_create = []
        inventory_updated = 0
        for _, row in df_inv.iterrows():
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

        # ── Step 7: Process Suppliers ──
        suppliers_created = 0
        suppliers_updated = 0
        supplier_name_to_id: dict[str, int] = {}

        if has_supplier_col:
            # Extract unique suppliers from the full CSV (not the product-deduped one)
            supplier_rows = df_full[df_full["Supplier"].notna()][["Supplier", "Reliability", "Lead Time"]].drop_duplicates(subset=["Supplier"])

            if not supplier_rows.empty:
                # Fetch existing suppliers for this company
                existing_sup_result = await db.execute(
                    select(Supplier).filter(Supplier.company_id == company_id)
                )
                existing_suppliers = {s.supplier_name: s for s in existing_sup_result.scalars().all()}

                sup_to_create = []
                for _, row in supplier_rows.iterrows():
                    name = row["Supplier"]
                    if not name:
                        continue
                    reliability = float(row["Reliability"]) if pd.notna(row["Reliability"]) else None
                    lead_time = int(row["Lead Time"]) if pd.notna(row["Lead Time"]) and row["Lead Time"] > 0 else None

                    if name in existing_suppliers:
                        sup = existing_suppliers[name]
                        if reliability is not None:
                            sup.reliability_score = reliability
                        if lead_time is not None:
                            sup.avg_lead_time = lead_time
                        supplier_name_to_id[name] = sup.id
                        suppliers_updated += 1
                    else:
                        sup_to_create.append({
                            "company_id": company_id,
                            "supplier_name": name,
                            "reliability_score": reliability,
                            "avg_lead_time": lead_time,
                        })

                if sup_to_create:
                    await db.execute(insert(Supplier), sup_to_create)
                    await db.flush()
                    suppliers_created = len(sup_to_create)

                    # Fetch newly inserted suppliers to get their IDs
                    new_sup_names = [d["supplier_name"] for d in sup_to_create]
                    new_sup_result = await db.execute(
                        select(Supplier).filter(
                            Supplier.company_id == company_id,
                            Supplier.supplier_name.in_(new_sup_names),
                        )
                    )
                    for s in new_sup_result.scalars().all():
                        supplier_name_to_id[s.supplier_name] = s.id

        # ── Step 8: Process Shipments ──
        shipments_created = 0

        if has_shipment_col and supplier_name_to_id:
            shipment_rows = df_full[
                df_full["Supplier"].notna() &
                df_full["Shipment Expected"].notna() &
                (df_full["Shipment Expected"].astype(str).str.strip() != "")
            ]

            if not shipment_rows.empty:
                # Fetch existing shipments for deduplication
                existing_ship_result = await db.execute(
                    select(Shipment)
                    .join(Supplier, Shipment.supplier_id == Supplier.id)
                    .filter(Supplier.company_id == company_id)
                )
                existing_ship_keys = set()
                for s in existing_ship_result.scalars().all():
                    existing_ship_keys.add((s.supplier_id, s.expected_delivery_date, s.shipping_cost))

                shipments_to_create = []
                for _, row in shipment_rows.iterrows():
                    sup_name = row["Supplier"]
                    sup_id = supplier_name_to_id.get(sup_name)
                    if not sup_id:
                        continue

                    try:
                        expected_date = pd.to_datetime(row["Shipment Expected"]).date()
                    except Exception:
                        continue

                    actual_date = None
                    if pd.notna(row.get("Shipment Actual")) and str(row["Shipment Actual"]).strip():
                        try:
                            actual_date = pd.to_datetime(row["Shipment Actual"]).date()
                        except Exception:
                            pass

                    cost = float(row["Shipment Cost"]) if pd.notna(row["Shipment Cost"]) else 0.0

                    # Dedup check
                    key = (sup_id, expected_date, cost)
                    if key in existing_ship_keys:
                        continue

                    shipments_to_create.append({
                        "supplier_id": sup_id,
                        "expected_delivery_date": expected_date,
                        "actual_delivery_date": actual_date,
                        "shipping_cost": cost,
                    })
                    existing_ship_keys.add(key)

                if shipments_to_create:
                    await db.execute(insert(Shipment), shipments_to_create)
                    shipments_created = len(shipments_to_create)

        # ── Step 9: Process Orders ──
        orders_created = 0

        if has_order_qty_col:
            # Use full DataFrame so multiple orders per product are preserved
            order_rows = df_full[df_full["Order Qty"].notna() & (df_full["Order Qty"] > 0)]

            if not order_rows.empty:
                # Fetch existing orders for deduplication
                existing_orders_result = await db.execute(
                    select(Order)
                    .join(Product, Order.product_id == Product.id)
                    .filter(Product.company_id == company_id)
                )
                existing_order_keys = set()
                for o in existing_orders_result.scalars().all():
                    existing_order_keys.add((o.product_id, o.order_date, o.quantity))

                orders_to_create = []
                for _, row in order_rows.iterrows():
                    product = existing_products.get(row["Product Name"])
                    if not product:
                        continue

                    quantity = int(row["Order Qty"])
                    if quantity <= 0:
                        continue

                    # Parse order date
                    order_date = None
                    if pd.notna(row.get("Order Date")) and str(row["Order Date"]).strip():
                        try:
                            order_date = pd.to_datetime(row["Order Date"]).date()
                        except Exception:
                            order_date = date.today()
                    else:
                        order_date = date.today()

                    region = row.get("Region") if pd.notna(row.get("Region")) else None
                    if region and not region.strip():
                        region = None

                    # Dedup check
                    key = (product.id, order_date, quantity)
                    if key in existing_order_keys:
                        continue

                    orders_to_create.append({
                        "product_id": product.id,
                        "order_date": order_date,
                        "quantity": quantity,
                        "region": region,
                    })
                    existing_order_keys.add(key)

                if orders_to_create:
                    await db.execute(insert(Order), orders_to_create)
                    orders_created = len(orders_to_create)

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
                "suppliers_created": suppliers_created,
                "suppliers_updated": suppliers_updated,
                "shipments_created": shipments_created,
                "orders_created": orders_created,
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
