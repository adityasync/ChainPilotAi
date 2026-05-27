from collections import defaultdict
from datetime import datetime
from pathlib import Path

import pandas as pd

from app.core.security import get_password_hash
from app.database import SessionLocal
from app.ml.evaluation.enhanced_insight_engine import EnhancedInsightEngine
from app.ml.inference.predictor import MLPredictor
from app.models.order import Order
from app.models.product_inventory import Inventory, Product
from app.models.supplier_shipment import Shipment, Supplier
from app.models.user_company import Company, User

TEST_EMAIL = "testuser@flowchain.local"
TEST_PASSWORD = "FlowChainTest@123"
TEST_COMPANY = "FlowChain Demo Company"


def load_superstore_dataframe() -> pd.DataFrame:
    csv_path = Path(__file__).resolve().parent.parent / "data" / "samples" / "sample_superstore.csv"
    df = pd.read_csv(csv_path)
    df["Order Date"] = pd.to_datetime(df["Order Date"])
    df["Ship Date"] = pd.to_datetime(df["Ship Date"])
    return df


def ensure_test_user(db) -> tuple[User, Company]:
    existing_user = db.query(User).filter(User.email == TEST_EMAIL).first()
    if existing_user:
        company = db.query(Company).filter(Company.id == existing_user.company_id).first()
        return existing_user, company

    company = Company(name=TEST_COMPANY, industry="Retail")
    db.add(company)
    db.commit()
    db.refresh(company)

    user = User(
        email=TEST_EMAIL,
        password_hash=get_password_hash(TEST_PASSWORD),
        company_id=company.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, company


def clear_company_data(db, company_id: int) -> None:
    products = db.query(Product).filter(Product.company_id == company_id).all()
    product_ids = [product.id for product in products]

    suppliers = db.query(Supplier).filter(Supplier.company_id == company_id).all()
    supplier_ids = [supplier.id for supplier in suppliers]

    if product_ids:
        db.query(Inventory).filter(Inventory.product_id.in_(product_ids)).delete(synchronize_session=False)
        db.query(Order).filter(Order.product_id.in_(product_ids)).delete(synchronize_session=False)
        db.query(Product).filter(Product.id.in_(product_ids)).delete(synchronize_session=False)

    if supplier_ids:
        db.query(Shipment).filter(Shipment.supplier_id.in_(supplier_ids)).delete(synchronize_session=False)
        db.query(Supplier).filter(Supplier.id.in_(supplier_ids)).delete(synchronize_session=False)

    db.commit()


def seed_products_inventory_orders(db, company_id: int, df: pd.DataFrame) -> dict[str, int]:
    grouped_rows: dict[str, list[dict]] = defaultdict(list)
    for row in df.to_dict(orient="records"):
        grouped_rows[row["Product Name"]].append(row)

    products_created = 0
    inventory_created = 0
    orders_created = 0

    for product_name, rows in grouped_rows.items():
        first_row = rows[0]
        sales_values = [float(row["Sales"]) for row in rows]
        avg_sales = sum(sales_values) / len(sales_values)
        max_sales = max(sales_values)

        product = Product(
            company_id=company_id,
            product_name=product_name,
            category=first_row["Category"],
            unit_cost=round(max(5.0, avg_sales * 0.55), 2),
            selling_price=round(max(8.0, avg_sales), 2),
        )
        db.add(product)
        db.flush()
        products_created += 1

        total_quantity = 0
        for row in rows:
            quantity = max(1, int(round(float(row["Sales"]) / max(avg_sales, 1))))
            total_quantity += quantity
            order = Order(
                product_id=product.id,
                order_date=row["Order Date"].date(),
                quantity=quantity,
                region=row["Region"],
            )
            db.add(order)
            orders_created += 1

        average_quantity = max(1, int(round(total_quantity / len(rows))))
        inventory = Inventory(
            product_id=product.id,
            warehouse=first_row["Region"],
            current_stock=max(average_quantity * 3, 10),
            reorder_point=max(average_quantity, 5),
            max_stock=max(average_quantity * 6, 25),
        )
        db.add(inventory)
        inventory_created += 1

    db.commit()
    return {
        "products_created": products_created,
        "inventory_created": inventory_created,
        "orders_created": orders_created,
    }


def seed_suppliers_and_shipments(db, company_id: int, df: pd.DataFrame) -> dict[str, int]:
    supplier_specs = [
        ("Furniture Supply Co", "Furniture", 6, 0.91),
        ("Office Essentials Ltd", "Office Supplies", 4, 0.87),
        ("Tech Distribution Hub", "Technology", 8, 0.73),
    ]

    created_suppliers: dict[str, Supplier] = {}
    for name, _, lead_time, reliability in supplier_specs:
        supplier = Supplier(
            company_id=company_id,
            supplier_name=name,
            avg_lead_time=lead_time,
            reliability_score=reliability,
        )
        db.add(supplier)
        db.flush()
        created_suppliers[name] = supplier

    shipment_rows = []
    for _, row in df.head(18).iterrows():
        category = row["Category"]
        if category == "Furniture":
            supplier = created_suppliers["Furniture Supply Co"]
        elif category == "Office Supplies":
            supplier = created_suppliers["Office Essentials Ltd"]
        else:
            supplier = created_suppliers["Tech Distribution Hub"]

        shipment_rows.append(
            Shipment(
                supplier_id=supplier.id,
                expected_delivery_date=row["Ship Date"].date(),
                actual_delivery_date=row["Ship Date"].date(),
                shipping_cost=round(max(25.0, float(row["Sales"]) * 0.08), 2),
            )
        )

    db.add_all(shipment_rows)
    db.commit()
    return {
        "suppliers_created": len(created_suppliers),
        "shipments_created": len(shipment_rows),
    }


def run_initial_analysis(db, company_id: int) -> dict[str, int]:
    predictor = MLPredictor()
    insight_engine = EnhancedInsightEngine(predictor)

    products = db.query(Product).filter(Product.company_id == company_id).all()
    suppliers = db.query(Supplier).filter(Supplier.company_id == company_id).all()

    product_data = []
    for product in products:
        total_stock = sum(item.current_stock for item in product.inventory_items)
        product_data.append({
            "id": product.id,
            "Availability": total_stock,
            "Number of products sold": len(product.orders),
            "Revenue generated": sum(order.quantity * product.selling_price for order in product.orders),
            "Stock levels": total_stock,
            "Lead times": 7,
            "Order quantities": sum(order.quantity for order in product.orders),
            "Shipping costs": 15,
            "Price": product.unit_cost,
        })

    supplier_data = []
    for supplier in suppliers:
        supplier_data.append({
            "id": supplier.id,
            "Lead times": supplier.avg_lead_time or 0,
            "Order quantities": 12,
            "Shipping costs": 30,
            "Price": 100,
            "Availability": 60,
            "Number of products sold": 200,
        })

    results = insight_engine.run_enhanced_analysis(
        db=db,
        company_id=company_id,
        product_data=product_data,
        supplier_data=supplier_data,
    )
    return {
        "predictions_created": results["predictions_count"],
        "insights_created": results["insights_count"],
    }


def main() -> None:
    db = SessionLocal()
    try:
        df = load_superstore_dataframe()
        user, company = ensure_test_user(db)
        clear_company_data(db, company.id)
        product_stats = seed_products_inventory_orders(db, company.id, df)
        supplier_stats = seed_suppliers_and_shipments(db, company.id, df)
        analysis_stats = run_initial_analysis(db, company.id)

        print(
            {
                "email": TEST_EMAIL,
                "company_id": company.id,
                **product_stats,
                **supplier_stats,
                **analysis_stats,
            }
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
