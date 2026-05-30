"""Shared fixtures for unit tests."""

import pytest
from datetime import date, datetime
from unittest.mock import MagicMock

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.database import Base
from app.models.user_company import User, Company
from app.models.product_inventory import Product, Inventory
from app.models.order import Order
from app.models.supplier_shipment import Supplier, Shipment
from app.models.ml_models import Prediction, Insight


# --- In-memory SQLite database ---

@pytest.fixture(scope="session")
def engine():
    """Create an in-memory SQLite engine for the test session."""
    eng = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture()
def db(engine) -> Session:
    """Yield a transactional database session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# --- Seed data fixtures ---

@pytest.fixture()
def company(db) -> Company:
    c = Company(id=1, name="TestCo", industry="Retail")
    db.add(c)
    db.commit()
    return c


@pytest.fixture()
def product(db, company) -> Product:
    p = Product(id=1, company_id=1, product_name="Widget A", category="Widgets", unit_cost=5.0, selling_price=10.0)
    db.add(p)
    db.commit()
    return p


@pytest.fixture()
def product_with_inventory(db, company) -> Product:
    p = Product(id=2, company_id=1, product_name="Widget B", category="Widgets", unit_cost=8.0, selling_price=15.0)
    db.add(p)
    db.flush()
    inv = Inventory(id=1, product_id=p.id, warehouse="WH1", current_stock=100, reorder_point=50, max_stock=200)
    db.add(inv)
    db.commit()
    return p


@pytest.fixture()
def supplier(db, company) -> Supplier:
    s = Supplier(id=1, company_id=1, supplier_name="Acme Supplies", avg_lead_time=7, reliability_score=0.9)
    db.add(s)
    db.commit()
    return s


@pytest.fixture()
def order(db, product) -> Order:
    o = Order(id=1, product_id=product.id, order_date=date(2026, 1, 15), quantity=20, region="East")
    db.add(o)
    db.commit()
    return o


@pytest.fixture()
def shipment(db, supplier) -> Shipment:
    s = Shipment(id=1, supplier_id=supplier.id, expected_delivery_date=date(2026, 2, 1), actual_delivery_date=date(2026, 2, 3), shipping_cost=150.0)
    db.add(s)
    db.commit()
    return s
