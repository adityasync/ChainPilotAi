from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io
import logging
from typing import Optional

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..models.product_inventory import Product, Inventory
from ..models.supplier_shipment import Supplier
from .ml_integration import insight_engine  # Reuse the initialized engine

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload/data")
async def upload_data(
    file: UploadFile = File(...),
    category_filter: Optional[str] = Form(None),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload CSV data to update inventory and products, then trigger analysis.
    Expected CSV columns:
    - Product Name
    - Category
    - Unit Cost
    - Selling Price
    - Current Stock
    - Warehouse (optional, default: 'primary')
    - Min Stock (optional, default: 10)
    - Max Stock (optional, default: 100)
    """
    company_id = get_current_user_company_id(db, current_user)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")

    try:
        # Read and parse CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Normalize column names (strip whitespace, lowercase)
        df.columns = [c.strip() for c in df.columns]
        
        required_cols = ['Product Name', 'Unit Cost', 'Selling Price', 'Current Stock']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

        # Process data
        products_updated = 0
        products_created = 0
        inventory_updated = 0
        
        for _, row in df.iterrows():
            # Apply category filter if provided
            row_category = row.get('Category', 'Uncategorized')
            if category_filter and category_filter.lower() != row_category.lower():
                continue

            product_name = str(row['Product Name']).strip()
            
            # 1. UPSERT Product
            product = db.query(Product).filter(
                Product.company_id == company_id,
                Product.product_name == product_name
            ).first()
            
            if product:
                # Update existing
                product.unit_cost = float(row['Unit Cost'])
                product.selling_price = float(row['Selling Price'])
                product.category = row_category
                products_updated += 1
            else:
                # Create new
                product = Product(
                    company_id=company_id,
                    product_name=product_name,
                    category=row_category,
                    unit_cost=float(row['Unit Cost']),
                    selling_price=float(row['Selling Price'])
                )
                db.add(product)
                db.flush()  # Get ID without committing
                products_created += 1
            
            # 2. UPSERT Inventory
            warehouse = row.get('Warehouse', 'Primary')
            inventory = db.query(Inventory).filter(
                Inventory.product_id == product.id,
                Inventory.warehouse == warehouse
            ).first()
            
            current_stock = int(row['Current Stock'])
            reorder_point = int(row.get('Min Stock', 10))
            max_stock = int(row.get('Max Stock', 100))
            
            if inventory:
                inventory.current_stock = current_stock
                inventory.reorder_point = reorder_point
                inventory.max_stock = max_stock
                inventory_updated += 1
            else:
                inventory = Inventory(
                    product_id=product.id,
                    warehouse=warehouse,
                    current_stock=current_stock,
                    reorder_point=reorder_point,
                    max_stock=max_stock
                )
                db.add(inventory)
        
        db.commit()
        
        # Trigger ML Analysis immediately
        # We need to fetch the fresh data structure expected by run_enhanced_analysis
        # But run_enhanced_analysis internally queries the DB! 
        # So we just pass company_id.
        
        # Note: run_enhanced_analysis requires product_data to be PASSED IN if we want to analyze SPECIFIC data,
        # OR it can query DB if we modify it? 
        # Let's check ml_integration.py/run_ml_analysis implementation.
        # It queries DB to build product_data list.
        # So we can just Call the same logic!
        
        # Reuse the logic by calling the engine directly.
        # We duplicate the data fetching logic for now OR we can call the service method if we refactor.
        # Ideally, we should reuse the code. 
        # Let's fetch data exactly as run_ml_analysis does.
        
        products = db.query(Product).filter(Product.company_id == company_id).all()
        product_data = []
        for prod in products:
            total_stock = sum(item.current_stock for item in prod.inventory_items) if prod.inventory_items else 0
            product_data.append({
                'id': prod.id,
                'Availability': total_stock,
                'Number of products sold': 0, 
                'Revenue generated': 0,
                'Stock levels': total_stock,
                'Lead times': 0,
                'Order quantities': 0, 
                'Shipping costs': 0,
                'Price': prod.unit_cost
            })
            
        suppliers = db.query(Supplier).filter(Supplier.company_id == company_id).all()
        supplier_data = []
        for sup in suppliers:
             supplier_data.append({
                'id': sup.id,
                'Lead times': sup.avg_lead_time or 0,
                'Order quantities': 0,
                'Shipping costs': 0,
                'Price': 0,
                'Availability': 0,
                'Number of products sold': 0
            })
            
        analysis_results = insight_engine.run_enhanced_analysis(
            db=db,
            company_id=company_id,
            product_data=product_data,
            supplier_data=supplier_data
        )
        
        return {
            "message": "Data processed and analysis completed successfully",
            "stats": {
                "products_created": products_created,
                "products_updated": products_updated,
                "inventory_records_updated": inventory_updated
            },
            "analysis": {
                "predictions_generated": analysis_results['predictions_count'],
                "insights_generated": analysis_results['insights_count']
            }
        }

    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        # Log traceback for debugging
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
